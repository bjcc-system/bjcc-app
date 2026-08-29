"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { createMatch, deleteMatch } from "./actions";

type Team = { id: string; name: string; initials: string };
type Tournament = { id: string; name: string };
type Match = {
  id: string;
  matchType: string;
  tournamentId: string | null;
  matchNumber: number | null;
  totalOvers: number;
  stage: string | null;
  team1Id: string;
  team2Id: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  status: string;
  team1Name?: string;
  team2Name?: string;
  tournamentName?: string | null;
};

export default function MatchesClient({
  allTeams,
  allTournaments,
  allMatches,
  tournamentTeamMap,
}: {
  allTeams: Team[];
  allTournaments: Tournament[];
  allMatches: Match[];
  tournamentTeamMap: Record<string, string[]>; // tournamentId -> teamId[]
}) {
  const [matchType, setMatchType] = useState<"TOURNAMENT" | "NORMAL">("NORMAL");
  const [selectedTournament, setSelectedTournament] = useState("");

  const availableTeams =
    matchType === "TOURNAMENT" && selectedTournament
      ? allTeams.filter((t) =>
          (tournamentTeamMap[selectedTournament] || []).includes(t.id)
        )
      : allTeams;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Match Management
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Schedule and manage cricket matches
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Match Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMatch} className="space-y-3">
              {/* Match Type */}
              <div className="space-y-1.5">
                <Label className="text-xs">Match Type</Label>
                <select
                  name="matchType"
                  value={matchType}
                  onChange={(e) => {
                    setMatchType(e.target.value as "TOURNAMENT" | "NORMAL");
                    setSelectedTournament("");
                  }}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="NORMAL">Normal Match</option>
                  <option value="TOURNAMENT">Tournament Match</option>
                </select>
              </div>

              {/* Tournament Selector (if TOURNAMENT) */}
              {matchType === "TOURNAMENT" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tournament</Label>
                    <select
                      name="tournamentId"
                      value={selectedTournament}
                      onChange={(e) => setSelectedTournament(e.target.value)}
                      required
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select Tournament</option>
                      {allTournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Match #</Label>
                      <Input name="matchNumber" type="number" placeholder="1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Stage</Label>
                      <select
                        name="stage"
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="LEAGUE">League</option>
                        <option value="QUARTER">Quarter Final</option>
                        <option value="SEMI">Semi Final</option>
                        <option value="FINAL">Final</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Normal match fields */}
              {matchType === "NORMAL" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Date</Label>
                      <Input name="date" type="date" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Time</Label>
                      <Input name="time" type="time" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Venue</Label>
                    <Input name="venue" placeholder="e.g. Beltala Ground" />
                  </div>
                </div>
              )}

              {/* Team Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Team 1</Label>
                  <select
                    name="team1Id"
                    required
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select</option>
                    {availableTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.initials || t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Team 2</Label>
                  <select
                    name="team2Id"
                    required
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select</option>
                    {availableTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.initials || t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Total Overs</Label>
                <Input name="totalOvers" type="number" defaultValue={10} required />
              </div>

              <Button type="submit" className="w-full" size="sm">
                Create Match
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Match List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            All Matches ({allMatches.length})
          </h2>
          {allMatches.length > 0 ? (
            <div className="space-y-3">
              {allMatches.map((m) => (
                <Card key={m.id} className="group relative">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {m.team1Name || "Team 1"} vs {m.team2Name || "Team 2"}
                          </span>
                          <Badge
                            variant={
                              m.status === "LIVE"
                                ? "destructive"
                                : m.status === "COMPLETED"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[10px]"
                          >
                            {m.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {m.matchType}
                          </Badge>
                          <span>{m.totalOvers} overs</span>
                          {m.tournamentName && <span>• {m.tournamentName}</span>}
                          {m.stage && <span>• {m.stage}</span>}
                          {m.matchNumber && <span>• Match #{m.matchNumber}</span>}
                        </div>
                      </div>
                      <form action={deleteMatch}>
                        <input type="hidden" name="id" value={m.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No matches scheduled yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
