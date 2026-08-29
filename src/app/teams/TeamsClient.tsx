"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

type Team = { id: string; name: string; initials: string; location: string | null; logo: string | null };
type Tournament = { id: string; name: string };

export default function TeamsClient({
  teams,
  tournaments,
  tournamentTeamMap,
}: {
  teams: Team[];
  tournaments: Tournament[];
  tournamentTeamMap: Record<string, string[]>;
}) {
  const [selectedTournament, setSelectedTournament] = useState<string>("ALL");

  const filteredTeams =
    selectedTournament === "ALL"
      ? teams
      : teams.filter((t) => (tournamentTeamMap[selectedTournament] || []).includes(t.id));

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Teams
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Browse teams in the council</p>
          </div>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="flex h-10 w-full md:w-64 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ALL">All Teams</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="group hover:border-primary/50 transition-colors bg-card/40 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform glow-blue shadow-lg">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-xl font-bold text-primary">{team.initials || team.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-1">{team.name}</h3>
                  {team.location && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{team.location}</p>
                  )}
                  {team.initials && (
                    <Badge variant="secondary" className="mt-2 text-[9px] px-1.5 py-0">
                      {team.initials}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            No teams found for the selected filter.
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
