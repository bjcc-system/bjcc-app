import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { matches, teams, balls } from "@/lib/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import ScorerClient from "./ScorerClient";

export const dynamic = "force-dynamic";

export default async function ScorerPage() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) redirect("/admin/gateway");

  // Get all matches that are SCHEDULED, TOSS, or LIVE
  const activeMatches = await db
    .select()
    .from(matches)
    .where(ne(matches.status, "COMPLETED"));

  const allTeams = await db.select().from(teams);
  const teamMap = new Map(allTeams.map((t) => [t.id, { name: t.name, initials: t.initials }]));

  // Enrich matches with team names
  const enrichedMatches = activeMatches.map((m) => ({
    ...m,
    team1Name: teamMap.get(m.team1Id)?.name || "Team 1",
    team1Initials: teamMap.get(m.team1Id)?.initials || "T1",
    team2Name: teamMap.get(m.team2Id)?.name || "Team 2",
    team2Initials: teamMap.get(m.team2Id)?.initials || "T2",
  }));

  // If there's a LIVE or TOSS match, get its balls
  const liveMatch = enrichedMatches.find(
    (m) => m.status === "LIVE" || m.status === "TOSS" || m.status === "INNINGS_BREAK"
  );

  let matchBalls: any[] = [];
  let score = { totalRuns: 0, wickets: 0, oversStr: "0.0", crr: "0.00", legalBalls: 0 };

  if (liveMatch) {
    const innings = liveMatch.currentInnings || 1;
    const allBalls = await db
      .select()
      .from(balls)
      .where(
        and(
          eq(balls.matchId, liveMatch.id),
          eq(balls.innings, innings),
          eq(balls.isUndone, false)
        )
      );

    matchBalls = allBalls;

    let totalRuns = 0, wickets = 0, legalBalls = 0;
    for (const b of allBalls) {
      totalRuns += b.runs + b.extras;
      if (b.isWicket) wickets++;
      if (b.extraType !== "WIDE" && b.extraType !== "NO_BALL") legalBalls++;
    }

    score = {
      totalRuns,
      wickets,
      legalBalls,
      oversStr: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      crr: legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : "0.00",
    };
  }

  // For 2nd innings, get 1st innings score
  let firstInningsScore: number | null = null;
  if (liveMatch && (liveMatch.currentInnings || 1) === 2) {
    const firstBalls = await db
      .select()
      .from(balls)
      .where(
        and(
          eq(balls.matchId, liveMatch.id),
          eq(balls.innings, 1),
          eq(balls.isUndone, false)
        )
      );
    firstInningsScore = firstBalls.reduce((sum, b) => sum + b.runs + b.extras, 0);
  }

  return (
    <ScorerClient
      matches={enrichedMatches}
      liveMatch={liveMatch || null}
      score={score}
      firstInningsScore={firstInningsScore}
      totalOvers={liveMatch?.totalOvers || 10}
    />
  );
}
