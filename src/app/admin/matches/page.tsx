import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { matches, teams, tournaments, tournamentTeams } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import MatchesClient from "./MatchesClient";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) redirect("/admin/gateway");

  const allTeams = await db.select().from(teams);
  const allTournaments = await db.select().from(tournaments);
  const allTournamentTeams = await db.select().from(tournamentTeams);
  const allMatches = await db.select().from(matches).orderBy(desc(matches.createdAt));

  // Build tournament -> teamIds map
  const tournamentTeamMap: Record<string, string[]> = {};
  for (const tt of allTournamentTeams) {
    if (!tournamentTeamMap[tt.tournamentId]) tournamentTeamMap[tt.tournamentId] = [];
    tournamentTeamMap[tt.tournamentId].push(tt.teamId);
  }

  // Build team name map
  const teamMap = new Map(allTeams.map((t) => [t.id, t.initials || t.name]));
  const tournamentMap = new Map(allTournaments.map((t) => [t.id, t.name]));

  const enrichedMatches = allMatches.map((m) => ({
    ...m,
    team1Name: teamMap.get(m.team1Id) || "Unknown",
    team2Name: teamMap.get(m.team2Id) || "Unknown",
    tournamentName: m.tournamentId ? tournamentMap.get(m.tournamentId) || null : null,
  }));

  return (
    <MatchesClient
      allTeams={allTeams.map((t) => ({ id: t.id, name: t.name, initials: t.initials }))}
      allTournaments={allTournaments.map((t) => ({ id: t.id, name: t.name }))}
      allMatches={enrichedMatches}
      tournamentTeamMap={tournamentTeamMap}
    />
  );
}
