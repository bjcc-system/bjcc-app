"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

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
  nrr: string;
};

type Tournament = { id: string; name: string };

export default function StatsClient({
  tournaments,
  overallStats,
  tournamentStatsMap,
}: {
  tournaments: Tournament[];
  overallStats: TeamStat[];
  tournamentStatsMap: Record<string, TeamStat[]>;
}) {
  const [selectedTournament, setSelectedTournament] = useState<string>("ALL");

  const currentStats =
    selectedTournament === "ALL"
      ? overallStats
      : tournamentStatsMap[selectedTournament] || [];

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Rankings & Stats
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Overall and tournament leaderboards</p>
          </div>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="flex h-10 w-full md:w-64 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Time</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase bg-muted/50 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-semibold w-12 text-center">Pos</th>
                  <th className="px-4 py-3 font-semibold">Team</th>
                  <th className="px-3 py-3 font-semibold text-center">P</th>
                  <th className="px-3 py-3 font-semibold text-center">W</th>
                  <th className="px-3 py-3 font-semibold text-center">L</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">Pts</th>
                  <th className="px-4 py-3 font-semibold text-right">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {currentStats.length > 0 ? (
                  currentStats.map((team, index) => (
                    <tr key={team.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 flex items-center gap-3 min-w-[200px]">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 glow-blue">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            team.initials || team.name.charAt(0)
                          )}
                        </div>
                        <span className="font-semibold">{team.name}</span>
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{team.played}</td>
                      <td className="px-3 py-3 text-center text-emerald-400 font-medium">{team.won}</td>
                      <td className="px-3 py-3 text-center text-red-400 font-medium">{team.lost}</td>
                      <td className="px-4 py-3 text-center font-bold text-primary">{team.points}</td>
                      <td className={`px-4 py-3 text-right font-medium ${parseFloat(team.nrr) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {parseFloat(team.nrr) > 0 ? "+" : ""}{team.nrr}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      No match data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
