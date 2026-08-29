import { db } from "@/lib/db";
import { matches, teams, balls, tournaments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allTournaments = await db.select().from(tournaments);
    
    // 1. Find live match
    const liveMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.status, "LIVE"))
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

    const score = {
      totalRuns,
      wickets,
      oversStr: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      crr: legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : "0.00",
      recentBalls,
    };

    const tournamentName = m.tournamentId ? allTournaments.find(t => t.id === m.tournamentId)?.name : null;

    const liveMatch = {
      ...m,
      team1,
      team2,
      tournamentName,
      score,
    };

    return NextResponse.json({ liveMatch });
  } catch (error) {
    return NextResponse.json({ liveMatch: null, error: "Failed to fetch live score" }, { status: 500 });
  }
}
