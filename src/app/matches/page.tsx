import { db } from "@/lib/db";
import { matches, teams, tournaments } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import MatchesClient from "./MatchesClient";

export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Scores & Match Fixtures - BJCC",
  description: "Watch live ball-by-ball cricket scores and view recent match results and upcoming schedules in the Beltala Jr Cricket Council.",
  keywords: ["cricket match live", "BJCC fixtures", "cricket scorecard", "live cricket score", "BJCC matches"],
};

export default async function MatchesPage() {
  const allMatches = await db.select().from(matches).orderBy(desc(matches.createdAt));
  const allTeams = await db.select().from(teams);
  const allTournaments = await db.select().from(tournaments);

  const teamMap = new Map(allTeams.map(t => [t.id, t]));
  const tournamentMap = new Map(allTournaments.map(t => [t.id, t]));

  const enrichedMatches = allMatches.map(m => ({
    ...m,
    team1Name: teamMap.get(m.team1Id)?.name || "Unknown",
    team1Initials: teamMap.get(m.team1Id)?.initials || "?",
    team2Name: teamMap.get(m.team2Id)?.name || "Unknown",
    team2Initials: teamMap.get(m.team2Id)?.initials || "?",
    tournamentName: m.tournamentId ? tournamentMap.get(m.tournamentId)?.name || null : null,
  }));

  const recentMatches = enrichedMatches.filter(m => m.status === "COMPLETED" || m.status === "LIVE" || m.status === "INNINGS_BREAK" || m.status === "DELAYED");
  const upcomingMatches = enrichedMatches.filter(m => m.status === "SCHEDULED" || m.status === "TOSS");

  return <MatchesClient recentMatches={recentMatches} upcomingMatches={upcomingMatches} />;
}
