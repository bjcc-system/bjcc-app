"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { getMatchBalls } from "./actions";

type Match = {
  id: string;
  team1Name: string;
  team1Initials: string;
  team1Logo: string | null;
  team2Name: string;
  team2Initials: string;
  team2Logo: string | null;
  tournamentName: string | null;
  status: string;
  matchType: string;
  stage: string | null;
  totalOvers: number;
  winnerId: string | null;
  resultDesc: string | null;
  date: string | null;
  createdAt: Date | null;
};

export default function MatchesClient({
  recentMatches,
  upcomingMatches,
}: {
  recentMatches: Match[];
  upcomingMatches: Match[];
}) {
  const [tab, setTab] = useState<"RECENT" | "UPCOMING">("RECENT");
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [matchBalls, setMatchBalls] = useState<any[]>([]);
  const [loadingBalls, setLoadingBalls] = useState(false);

  async function toggleMatch(matchId: string) {
    if (expandedMatch === matchId) {
      setExpandedMatch(null);
      return;
    }
    setExpandedMatch(matchId);
    setLoadingBalls(true);
    const balls = await getMatchBalls(matchId);
    setMatchBalls(balls);
    setLoadingBalls(false);
  }

  // Group balls by innings and over
  const innings1 = matchBalls.filter((b) => b.innings === 1 && !b.isUndone);
  const innings2 = matchBalls.filter((b) => b.innings === 2 && !b.isUndone);

  const groupOvers = (balls: any[]) => {
    const overs: Record<number, any[]> = {};
    balls.forEach((b) => {
      if (!overs[b.overNumber]) overs[b.overNumber] = [];
      overs[b.overNumber].push(b);
    });
    return overs;
  };

  const renderOver = (overNumber: string, balls: any[]) => {
    let totalRuns = 0;
    const items = balls.map((b, i) => {
      totalRuns += b.runs + b.extras;
      let label = b.runs.toString();
      let color = "bg-muted text-muted-foreground";
      
      if (b.isWicket) {
        label = "W";
        color = "bg-red-500 text-white";
      } else if (b.extraType === "WIDE") {
        label = `WD${b.extras > 1 ? `+${b.runs}` : ""}`;
        color = "bg-yellow-500/20 text-yellow-500";
      } else if (b.extraType === "NO_BALL") {
        label = `NB${b.runs > 0 ? `+${b.runs}` : ""}`;
        color = "bg-orange-500/20 text-orange-500";
      } else if (b.runs === 4) {
        label = "4";
        color = "bg-blue-500 text-white";
      } else if (b.runs === 6) {
        label = "6";
        color = "bg-emerald-500 text-white";
      } else if (b.runs === 0) {
        label = "•";
      }

      return (
        <div key={i} className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${color}`}>
          {label}
        </div>
      );
    });

    return (
      <div key={overNumber} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
        <div className="w-12 text-xs font-semibold text-muted-foreground">Ov {parseInt(overNumber) + 1}</div>
        <div className="flex-1 flex flex-wrap gap-1">{items}</div>
        <div className="w-8 text-right text-xs font-bold">{totalRuns}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Matches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Recent results and upcoming fixtures</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setTab("RECENT")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              tab === "RECENT" ? "bg-background shadow text-foreground" : "text-muted-foreground"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setTab("UPCOMING")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              tab === "UPCOMING" ? "bg-background shadow text-foreground" : "text-muted-foreground"
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Match List */}
        <div className="space-y-4">
          {(tab === "RECENT" ? recentMatches : upcomingMatches).map((m) => (
            <Card key={m.id} className="overflow-hidden bg-card/60 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <div 
                  className={`p-4 ${tab === "RECENT" ? "cursor-pointer hover:bg-muted/30 transition-colors" : ""}`}
                  onClick={() => tab === "RECENT" && toggleMatch(m.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                      {m.tournamentName || "Normal Match"} • {m.totalOvers} Overs
                    </div>
                    {m.status === "LIVE" ? (
                      <Badge variant="destructive" className="animate-pulse-live text-[9px] px-1.5">LIVE</Badge>
                    ) : (
                      <div className="text-[10px] text-muted-foreground">
                        {m.date || (m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary glow-blue overflow-hidden">
                        {m.team1Logo ? <img src={m.team1Logo} alt={m.team1Initials} className="w-full h-full object-cover" /> : m.team1Initials}
                      </div>
                      <span className="text-xs font-semibold">{m.team1Name}</span>
                    </div>
                    <div className="px-4 text-xs font-bold text-muted-foreground">VS</div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary glow-blue overflow-hidden">
                        {m.team2Logo ? <img src={m.team2Logo} alt={m.team2Initials} className="w-full h-full object-cover" /> : m.team2Initials}
                      </div>
                      <span className="text-xs font-semibold">{m.team2Name}</span>
                    </div>
                  </div>

                  {m.resultDesc && (
                    <div className="mt-4 pt-3 border-t border-border/50 text-center">
                      <span className="text-xs font-medium text-emerald-400 flex items-center justify-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5" />
                        {m.resultDesc}
                      </span>
                    </div>
                  )}

                  {tab === "RECENT" && (
                    <div className="mt-2 flex justify-center text-muted-foreground">
                      {expandedMatch === m.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  )}
                </div>

                {/* Expanded Details (Over by Over) */}
                {expandedMatch === m.id && (
                  <div className="bg-background/50 border-t border-border/50 p-4 animate-in slide-in-from-top-2 duration-300">
                    {loadingBalls ? (
                      <div className="text-center text-xs text-muted-foreground py-4 animate-pulse">Loading over details...</div>
                    ) : (
                      <div className="space-y-6">
                        {innings1.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border/50 pb-2">
                              Innings 1
                            </h3>
                            {Object.entries(groupOvers(innings1)).map(([over, balls]) => renderOver(over, balls))}
                          </div>
                        )}
                        {innings2.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border/50 pb-2">
                              Innings 2
                            </h3>
                            {Object.entries(groupOvers(innings2)).map(([over, balls]) => renderOver(over, balls))}
                          </div>
                        )}
                        {innings1.length === 0 && innings2.length === 0 && (
                          <div className="text-center text-xs text-muted-foreground">No ball data recorded for this match.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {(tab === "RECENT" ? recentMatches : upcomingMatches).length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No matches found.
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
