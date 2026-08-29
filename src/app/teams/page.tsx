import { db } from "@/lib/db";
import { teams, tournaments, tournamentTeams } from "@/lib/db/schema";
import TeamsClient from "./TeamsClient";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const allTeams = await db.select().from(teams);
  const allTournaments = await db.select().from(tournaments);
  const allTournamentTeams = await db.select().from(tournamentTeams);

  const tournamentTeamMap: Record<string, string[]> = {};
  for (const tt of allTournamentTeams) {
    if (!tournamentTeamMap[tt.tournamentId]) tournamentTeamMap[tt.tournamentId] = [];
    tournamentTeamMap[tt.tournamentId].push(tt.teamId);
  }

  return (
    <TeamsClient
      teams={allTeams}
      tournaments={allTournaments}
      tournamentTeamMap={tournamentTeamMap}
    />
  );
}
