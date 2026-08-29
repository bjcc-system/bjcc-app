import { db } from "@/lib/db";
import { matches, teams, tournaments, balls, tournamentTeams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Points Table & Team Rankings - BJCC",
  description: "Check the latest team rankings, Net Run Rate (NRR), and points table for Beltala Jr Cricket Council tournaments.",
  keywords: ["cricket points table", "cricket team rankings", "cricket NRR", "BJCC leaderboard", "cricket tournament standings"],
};

type TeamStat = {
  id: string;
  name: string;
  initials: string;
  logo: string | null;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
  nrr: string;
};

// Helper to calculate overs from legal balls
function ballsToOvers(balls: number) {
  return Math.floor(balls / 6) + (balls % 6) / 6;
}

export default async function StatsPage() {
  const allTeams = await db.select().from(teams);
  const allTournaments = await db.select().from(tournaments);
  const allMatches = await db.select().from(matches).where(eq(matches.status, "COMPLETED"));
  const allBalls = await db.select().from(balls).where(eq(balls.isUndone, false));
  const allTournamentTeams = await db.select().from(tournamentTeams);

  // Helper to build stats for a given set of matches
  const buildStatsForMatches = (targetMatches: typeof allMatches, validTeams?: string[]) => {
    const statsMap = new Map<string, TeamStat>();

    // Initialize map
    allTeams.forEach((t) => {
      if (!validTeams || validTeams.includes(t.id)) {
        statsMap.set(t.id, {
          id: t.id,
          name: t.name,
          initials: t.initials,
          logo: t.logo,
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          points: 0,
          runsScored: 0,
          oversFaced: 0,
          runsConceded: 0,
          oversBowled: 0,
          nrr: "0.00",
        });
      }
    });

    // Process Matches (W, L, T, Pts, Played)
    targetMatches.forEach((m) => {
      const t1 = statsMap.get(m.team1Id);
      const t2 = statsMap.get(m.team2Id);
      if (t1) t1.played++;
      if (t2) t2.played++;

      if (m.resultDesc === "Match Tied") {
        if (t1) { t1.tied++; t1.points += 1; }
        if (t2) { t2.tied++; t2.points += 1; }
      } else if (m.winnerId) {
        const winner = statsMap.get(m.winnerId);
        const loserId = m.winnerId === m.team1Id ? m.team2Id : m.team1Id;
        const loser = statsMap.get(loserId);
        if (winner) { winner.won++; winner.points += 2; }
        if (loser) { loser.lost++; }
      }
    });

    // Process Balls (Runs, Overs)
    // Create a fast lookup for balls by matchId
    const ballsByMatch = new Map<string, typeof allBalls>();
    allBalls.forEach(b => {
      if (!ballsByMatch.has(b.matchId)) ballsByMatch.set(b.matchId, []);
      ballsByMatch.get(b.matchId)!.push(b);
    });

    targetMatches.forEach((m) => {
      const mBalls = ballsByMatch.get(m.id) || [];
      const battingFirstId = m.battingFirstId || m.team1Id;
      const battingSecondId = battingFirstId === m.team1Id ? m.team2Id : m.team1Id;

      let t1Runs = 0, t1Balls = 0, t2Runs = 0, t2Balls = 0;

      mBalls.forEach(b => {
        const isLegal = b.extraType !== "WIDE" && b.extraType !== "NO_BALL";
        if (b.innings === 1) {
          t1Runs += b.runs + b.extras;
          if (isLegal) t1Balls++;
        } else if (b.innings === 2) {
          t2Runs += b.runs + b.extras;
          if (isLegal) t2Balls++;
        }
      });

      const firstTeam = statsMap.get(battingFirstId);
      const secondTeam = statsMap.get(battingSecondId);

      if (firstTeam) {
        firstTeam.runsScored += t1Runs;
        firstTeam.oversFaced += ballsToOvers(t1Balls);
        firstTeam.runsConceded += t2Runs;
        firstTeam.oversBowled += ballsToOvers(t2Balls);
      }
      if (secondTeam) {
        secondTeam.runsScored += t2Runs;
        secondTeam.oversFaced += ballsToOvers(t2Balls);
        secondTeam.runsConceded += t1Runs;
        secondTeam.oversBowled += ballsToOvers(t1Balls);
      }
    });

    // Calculate NRR & Sort
    const finalStats = Array.from(statsMap.values()).map(s => {
      const rpOversFor = s.oversFaced > 0 ? s.runsScored / s.oversFaced : 0;
      const rpOversAgainst = s.oversBowled > 0 ? s.runsConceded / s.oversBowled : 0;
      s.nrr = (rpOversFor - rpOversAgainst).toFixed(3);
      return s;
    });

    finalStats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return parseFloat(b.nrr) - parseFloat(a.nrr);
    });

    return finalStats;
  };

  const overallStats = buildStatsForMatches(allMatches);

  const tournamentStatsMap: Record<string, TeamStat[]> = {};
  allTournaments.forEach(t => {
    const tMatches = allMatches.filter(m => m.tournamentId === t.id);
    const validTeams = allTournamentTeams.filter(tt => tt.tournamentId === t.id).map(tt => tt.teamId);
    tournamentStatsMap[t.id] = buildStatsForMatches(tMatches, validTeams);
  });

  return (
    <StatsClient
      tournaments={allTournaments}
      overallStats={overallStats}
      tournamentStatsMap={tournamentStatsMap}
    />
  );
}
