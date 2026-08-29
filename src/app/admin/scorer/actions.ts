"use server";

import { db } from "@/lib/db";
import { balls, matches } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";

// Helper: Calculate score from balls
async function calcScore(matchId: string, innings: number) {
  const allBalls = await db
    .select()
    .from(balls)
    .where(
      and(
        eq(balls.matchId, matchId),
        eq(balls.innings, innings),
        eq(balls.isUndone, false)
      )
    );

  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;

  for (const b of allBalls) {
    totalRuns += b.runs + b.extras;
    if (b.isWicket) wickets++;
    // Wides and no-balls are NOT legal deliveries
    if (b.extraType !== "WIDE" && b.extraType !== "NO_BALL") {
      legalBalls++;
    }
  }

  const overs = Math.floor(legalBalls / 6);
  const ballsInOver = legalBalls % 6;
  const oversStr = `${overs}.${ballsInOver}`;
  const crr = legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : "0.00";

  return { totalRuns, wickets, legalBalls, oversStr, crr, ballCount: allBalls.length };
}

// Get next ball position
async function getNextBallPosition(matchId: string, innings: number) {
  const allBalls = await db
    .select()
    .from(balls)
    .where(
      and(
        eq(balls.matchId, matchId),
        eq(balls.innings, innings),
        eq(balls.isUndone, false)
      )
    );

  let legalBalls = 0;
  for (const b of allBalls) {
    if (b.extraType !== "WIDE" && b.extraType !== "NO_BALL") {
      legalBalls++;
    }
  }

  return {
    overNumber: Math.floor(legalBalls / 6),
    ballNumber: (legalBalls % 6) + 1,
  };
}

// Record a ball
export async function recordBall(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const innings = parseInt(formData.get("innings") as string);
  const runs = parseInt(formData.get("runs") as string) || 0;
  const extras = parseInt(formData.get("extras") as string) || 0;
  const extraType = (formData.get("extraType") as string) || null;
  const isWicket = formData.get("isWicket") === "true";
  const wicketType = (formData.get("wicketType") as string) || null;

  const pos = await getNextBallPosition(matchId, innings);

  await db.insert(balls).values({
    matchId,
    innings,
    overNumber: pos.overNumber,
    ballNumber: pos.ballNumber,
    runs,
    extras,
    extraType,
    isWicket,
    wicketType,
  });

  // Update match status to LIVE if not already
  await db
    .update(matches)
    .set({ status: "LIVE" })
    .where(eq(matches.id, matchId));

  // Sync to Redis
  await syncToRedis(matchId);
  revalidatePath("/admin/scorer");
}

// Undo last ball
export async function undoLastBall(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const innings = parseInt(formData.get("innings") as string);

  const lastBall = await db
    .select()
    .from(balls)
    .where(
      and(
        eq(balls.matchId, matchId),
        eq(balls.innings, innings),
        eq(balls.isUndone, false)
      )
    )
    .orderBy(desc(balls.timestamp))
    .limit(1);

  if (lastBall.length > 0) {
    await db
      .update(balls)
      .set({ isUndone: true })
      .where(eq(balls.id, lastBall[0].id));
  }

  await syncToRedis(matchId);
  revalidatePath("/admin/scorer");
}

// Redo last undone ball
export async function redoLastBall(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const innings = parseInt(formData.get("innings") as string);

  const lastUndone = await db
    .select()
    .from(balls)
    .where(
      and(
        eq(balls.matchId, matchId),
        eq(balls.innings, innings),
        eq(balls.isUndone, true)
      )
    )
    .orderBy(desc(balls.timestamp))
    .limit(1);

  if (lastUndone.length > 0) {
    await db
      .update(balls)
      .set({ isUndone: false })
      .where(eq(balls.id, lastUndone[0].id));
  }

  await syncToRedis(matchId);
  revalidatePath("/admin/scorer");
}

// Start toss phase
export async function startToss(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  await db
    .update(matches)
    .set({ status: "TOSS" })
    .where(eq(matches.id, matchId));
  revalidatePath("/admin/scorer");
}

// Set toss
export async function setToss(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const tossWinnerId = formData.get("tossWinnerId") as string;
  const tossDecision = formData.get("tossDecision") as string; // BAT or BOWL
  const team1Id = formData.get("team1Id") as string;
  const team2Id = formData.get("team2Id") as string;

  // Determine batting first team
  let battingFirstId: string;
  if (tossDecision === "BAT") {
    battingFirstId = tossWinnerId;
  } else {
    battingFirstId = tossWinnerId === team1Id ? team2Id : team1Id;
  }

  await db
    .update(matches)
    .set({
      tossWinnerId,
      tossDecision,
      battingFirstId,
      status: "TOSS",
      currentInnings: 1,
    })
    .where(eq(matches.id, matchId));

  revalidatePath("/admin/scorer");
}

// Switch to 2nd innings
export async function endInnings(formData: FormData) {
  const matchId = formData.get("matchId") as string;

  await db
    .update(matches)
    .set({ currentInnings: 2, status: "INNINGS_BREAK" })
    .where(eq(matches.id, matchId));

  await syncToRedis(matchId);
  revalidatePath("/admin/scorer");
}

// End match
export async function endMatch(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match[0]) return;

  const m = match[0];
  const score1 = await calcScore(matchId, 1);
  const score2 = await calcScore(matchId, 2);

  let winnerId: string | null = null;
  let resultDesc = "";

  const battingFirstId = m.battingFirstId || m.team1Id;
  const battingSecondId = battingFirstId === m.team1Id ? m.team2Id : m.team1Id;

  if (score1.totalRuns > score2.totalRuns) {
    winnerId = battingFirstId;
    resultDesc = `Won by ${score1.totalRuns - score2.totalRuns} runs`;
  } else if (score2.totalRuns > score1.totalRuns) {
    winnerId = battingSecondId;
    resultDesc = `Won by ${10 - score2.wickets} wickets`;
  } else {
    resultDesc = "Match Tied";
  }

  await db
    .update(matches)
    .set({ status: "COMPLETED", winnerId, resultDesc })
    .where(eq(matches.id, matchId));

  // Clear Redis live data
  await redis.del("live_match");
  revalidatePath("/admin/scorer");
  revalidatePath("/");
  revalidatePath("/live");
}

// Delay match
export async function delayMatch(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  await db
    .update(matches)
    .set({ status: "DELAYED" })
    .where(eq(matches.id, matchId));
  await redis.del("live_match");
  revalidatePath("/admin/scorer");
}

// Restart match — clear all balls
export async function restartMatch(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  await db.delete(balls).where(eq(balls.matchId, matchId));
  await db
    .update(matches)
    .set({ status: "TOSS", currentInnings: 1, winnerId: null, resultDesc: null })
    .where(eq(matches.id, matchId));
  await redis.del("live_match");
  revalidatePath("/admin/scorer");
}

// Sync scoring state to Redis for live public display
async function syncToRedis(matchId: string) {
  const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match[0]) return;

  const m = match[0];
  const currentInnings = m.currentInnings || 1;
  const battingFirstId = m.battingFirstId || m.team1Id;

  // Get current innings score
  const score = await calcScore(matchId, currentInnings);

  // Get team names
  const { teams } = await import("@/lib/db/schema");
  const team1 = await db.select().from(teams).where(eq(teams.id, m.team1Id)).limit(1);
  const team2 = await db.select().from(teams).where(eq(teams.id, m.team2Id)).limit(1);

  const battingTeamId = currentInnings === 1 ? battingFirstId : (battingFirstId === m.team1Id ? m.team2Id : m.team1Id);
  const battingTeamName =
    battingTeamId === m.team1Id
      ? team1[0]?.name || "Team 1"
      : team2[0]?.name || "Team 2";

  let target: number | null = null;
  let runsNeeded: number | null = null;
  let ballsLeft: number | null = null;
  let rrr: string | null = null;

  if (currentInnings === 2) {
    const firstInningsScore = await calcScore(matchId, 1);
    target = firstInningsScore.totalRuns + 1;
    runsNeeded = target - score.totalRuns;
    const totalBalls = (m.totalOvers || 10) * 6;
    ballsLeft = totalBalls - score.legalBalls;
    rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "0.00";
  }

  await redis.set("live_match", {
    battingTeam: battingTeamName,
    runs: score.totalRuns,
    wickets: score.wickets,
    overs: score.oversStr,
    crr: score.crr,
    target,
    runsNeeded,
    ballsLeft,
    rrr,
  });
}
