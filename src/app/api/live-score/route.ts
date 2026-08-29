import { db } from "@/lib/db";
import { matches, teams, balls, tournaments } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allTournaments = await db.select().from(tournaments);
    
    // 1. Find live match
    const liveMatches = await db
      .select()
      .from(matches)
      .where(inArray(matches.status, ["LIVE", "TOSS", "INNINGS_BREAK"]))
      .limit(1);

    const m = liveMatches[0];
    if (!m) return NextResponse.json({ liveMatch: null });

    // 2. Fetch teams
    const team1List = await db.select().from(teams).where(eq(teams.id, m.team1Id)).limit(1);
    const team2List = await db.select().from(teams).where(eq(teams.id, m.team2Id)).limit(1);
    const team1 = team1List[0];
    const team2 = team2List[0];

    // 3. Fetch balls for current innings
    const innings = m.currentInnings || 1;
    const matchBalls = await db
      .select()
      .from(balls)
      .where(and(eq(balls.matchId, m.id), eq(balls.innings, innings), eq(balls.isUndone, false)));

    let totalRuns = 0, wickets = 0, legalBalls = 0;
    for (const b of matchBalls) {
      totalRuns += b.runs + b.extras;
      if (b.isWicket) wickets++;
      if (b.extraType !== "WIDE" && b.extraType !== "NO_BALL") legalBalls++;
    }

    const recentBalls = matchBalls
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, 10)
      .reverse();

    // 4. Calculate target if 2nd innings
    let target = null;
    let runsNeeded = null;
    let ballsLeft = null;
    
    if (innings === 2) {
      const firstInningsBalls = await db
        .select()
        .from(balls)
        .where(and(eq(balls.matchId, m.id), eq(balls.innings, 1), eq(balls.isUndone, false)));
      
      const firstInningsScore = firstInningsBalls.reduce((sum, b) => sum + b.runs + b.extras, 0);
      target = firstInningsScore + 1;
      runsNeeded = target - totalRuns;
      ballsLeft = (m.totalOvers * 6) - legalBalls;
    }

    const score = {
      totalRuns,
      wickets,
      oversStr: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      crr: legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : "0.00",
      recentBalls,
      target,
      runsNeeded,
      ballsLeft
    };

    const tournamentName = m.tournamentId ? allTournaments.find(t => t.id === m.tournamentId)?.name : null;

    const liveMatch = {
      ...m,
      team1,
      team2,
      tournamentName,
      score,
    };

    // 5. Fetch last match
    const lastMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.status, "COMPLETED"))
      .orderBy(desc(matches.createdAt))
      .limit(1);
    
    let lastMatch = null;
    if (lastMatches[0]) {
      const lm = lastMatches[0];
      const lmTeam1List = await db.select().from(teams).where(eq(teams.id, lm.team1Id)).limit(1);
      const lmTeam2List = await db.select().from(teams).where(eq(teams.id, lm.team2Id)).limit(1);
      lastMatch = {
        ...lm,
        team1: lmTeam1List[0],
        team2: lmTeam2List[0],
        tournamentName: lm.tournamentId ? allTournaments.find(t => t.id === lm.tournamentId)?.name : null,
      };
    }

    return NextResponse.json({ liveMatch, lastMatch });
  } catch (error) {
    return NextResponse.json({ liveMatch: null, lastMatch: null, error: "Failed to fetch matches" }, { status: 500 });
  }
}
