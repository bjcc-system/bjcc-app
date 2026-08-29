"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

import { Calendar, ChevronRight, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function HomeRealtimeFeed({ 
  initialLiveMatch, 
  initialLastMatch,
  initialUpcomingMatches,
  initialRankings,
  teamsSection
}: { 
  initialLiveMatch: any, 
  initialLastMatch: any,
  initialUpcomingMatches: any[],
  initialRankings: any[],
  teamsSection: React.ReactNode
}) {
  const [liveMatch, setLiveMatch] = useState(initialLiveMatch);
  const [lastMatch, setLastMatch] = useState(initialLastMatch);
  const [upcomingMatches, setUpcomingMatches] = useState(initialUpcomingMatches);
  const [rankings, setRankings] = useState(initialRankings);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/live-score", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.liveMatch !== undefined) setLiveMatch(data.liveMatch);
          if (data.lastMatch) setLastMatch(data.lastMatch);
          if (data.upcomingMatches) setUpcomingMatches(data.upcomingMatches);
          if (data.rankings) setRankings(data.rankings);
        }
      } catch (err) {
        console.error("Failed to fetch home feed", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* LIVE MATCH */}
      {liveMatch && ["LIVE", "TOSS", "INNINGS_BREAK"].includes(liveMatch.status) && (
        <Card className="border-red-500 bg-red-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse"></div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="destructive" className="animate-pulse-live text-[10px] gap-1 px-2 h-5">
                <Activity className="h-3 w-3" /> LIVE
              </Badge>
              <div className="text-[10px] text-muted-foreground uppercase font-medium bg-background/50 px-2 py-0.5 rounded-sm">
                {liveMatch.tournamentName || "Normal Match"} {liveMatch.matchNumber ? `• M-${liveMatch.matchNumber}` : ""}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
                  {liveMatch.team1?.logo ? <img src={liveMatch.team1?.logo} alt="" className="w-full h-full object-cover" /> : liveMatch.team1?.initials}
                </div>
                <div className="text-xs font-bold text-center line-clamp-1">{liveMatch.team1?.name}</div>
              </div>
              
              <div className="flex flex-col items-center justify-center px-2 flex-1">
                {liveMatch.status === "TOSS" ? (
                  <div className="text-xs font-bold text-muted-foreground uppercase text-center bg-background/50 px-3 py-2 rounded-md border border-border/50">
                    Toss Time
                  </div>
                ) : liveMatch.status === "INNINGS_BREAK" ? (
                  <div className="text-xs font-bold text-amber-500 uppercase text-center bg-amber-500/10 px-3 py-2 rounded-md border border-amber-500/20">
                    Innings Break
                    {liveMatch.score?.target && (
                      <div className="text-[10px] mt-1 font-bold text-foreground">
                        Target: {liveMatch.score.target}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-black tabular-nums tracking-tight">
                      {liveMatch.score?.totalRuns || 0}<span className="text-xl text-muted-foreground">/{liveMatch.score?.wickets || 0}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium mt-1">
                      Overs: <span className="text-foreground">{liveMatch.score?.oversStr || "0.0"}</span>
                    </div>
                    {liveMatch.score?.target && (
                      <div className="flex flex-col items-center mt-1">
                        <div className="text-[10px] font-bold text-emerald-400">
                          Target: {liveMatch.score.target}
                        </div>
                        <div className="text-[10px] font-bold text-yellow-400">
                          Need {liveMatch.score.runsNeeded} in {liveMatch.score.ballsLeft} balls
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
                  {liveMatch.team2?.logo ? <img src={liveMatch.team2?.logo} alt="" className="w-full h-full object-cover" /> : liveMatch.team2?.initials}
                </div>
                <div className="text-xs font-bold text-center line-clamp-1">{liveMatch.team2?.name}</div>
              </div>
            </div>

            {liveMatch.score?.recentBalls && liveMatch.score.recentBalls.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Balls</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CRR: {liveMatch.score.crr || "0.00"}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {liveMatch.score.recentBalls.map((b: any, index: number, arr: any[]) => {
                    const isBoundary = b.runs === 4 || b.runs === 6;
                    const isWicket = b.isWicket;
                    const isExtra = b.extras > 0;
                    
                    let display = b.runs.toString();
                    if (isWicket) display = "W";
                    else if (b.extraType === "WIDE") display = `${b.extras}wd`;
                    else if (b.extraType === "NO_BALL") display = `${b.runs}nb`;
                    else if (b.runs === 0) display = "•";

                    let showDivider = false;
                    if (index > 0) {
                      const prevBall = arr[index - 1];
                      if (prevBall.overNumber !== b.overNumber) {
                        showDivider = true;
                      }
                    }

                    return (
                      <div key={b.id} className="flex items-center gap-1.5 shrink-0">
                        {showDivider && <div className="h-4 w-[1px] bg-border mx-0.5"></div>}
                        <div 
                          className={`min-w-[28px] h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
                            ${isWicket ? 'bg-red-500 text-white' : 
                              isBoundary ? 'bg-emerald-500 text-white' : 
                              isExtra ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'}`}
                        >
                          {display}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {liveMatch.venue && (
              <div className="mt-3 pt-3 border-t border-border/30 text-center">
                <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" /> {liveMatch.venue}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LAST MATCH */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-4 w-4" /> Last Match
          </h2>
        </div>
        {lastMatch ? (
          <Card className="bg-card/40 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="text-[10px] text-muted-foreground mb-3 text-center">
                {lastMatch.tournamentName || "Normal Match"} • {lastMatch.date || "Recently"}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary overflow-visible">
                    {lastMatch.winnerId === lastMatch.team1Id && (
                      <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400/20" style={{ animationDuration: '3s' }}></div>
                    )}
                    <div className="w-full h-full rounded-full overflow-hidden border border-border/50 relative z-10 bg-background flex items-center justify-center">
                      {lastMatch.team1?.logo ? <img src={lastMatch.team1?.logo} alt="" className="w-full h-full object-cover" /> : lastMatch.team1?.initials}
                    </div>
                  </div>
                  <span className="text-sm font-bold line-clamp-1">
                    {lastMatch.team1?.name}
                  </span>
                </div>
                <div className="text-[10px] font-black text-muted-foreground px-2">VS</div>
                <div className="flex items-center gap-2 flex-1 justify-end text-right">
                  <span className="text-sm font-bold line-clamp-1">
                    {lastMatch.team2?.name}
                  </span>
                  <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary overflow-visible">
                    {lastMatch.winnerId === lastMatch.team2Id && (
                      <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400/20" style={{ animationDuration: '3s' }}></div>
                    )}
                    <div className="w-full h-full rounded-full overflow-hidden border border-border/50 relative z-10 bg-background flex items-center justify-center">
                      {lastMatch.team2?.logo ? <img src={lastMatch.team2?.logo} alt="" className="w-full h-full object-cover" /> : lastMatch.team2?.initials}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 text-center">
                <span className="text-xs font-medium text-emerald-400">
                  {lastMatch.resultDesc?.startsWith("Won by") 
                    ? `${lastMatch.winnerId === lastMatch.team1Id ? lastMatch.team1?.name : (lastMatch.winnerId === lastMatch.team2Id ? lastMatch.team2?.name : "")} ${lastMatch.resultDesc.toLowerCase()}`
                    : lastMatch.resultDesc}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-muted/10 border-border/50 border-dashed">
            <CardContent className="p-6 text-center text-xs text-muted-foreground">
              No recent matches found.
            </CardContent>
          </Card>
        )}
      </div>

      {/* UPCOMING MATCHES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Upcoming
          </h2>
          <Link href="/matches">
            <div className="text-xs font-medium text-primary flex items-center hover:underline">
              View All <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>
        </div>
        {upcomingMatches.length > 0 ? (
          <div className="grid gap-2">
            {upcomingMatches.map((m: any) => (
              <Card key={m.id} className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-muted/20 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      {m.tournamentName || "Friendly"} {m.matchNumber ? `• M-${m.matchNumber}` : ""}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium" suppressHydrationWarning>
                      <Calendar className="h-3 w-3" />
                      {m.date ? `${m.date} ${m.time ? `• ${m.time}` : ""}` : (m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "TBD")}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary overflow-hidden">
                        {m.team1?.logo ? <img src={m.team1?.logo} alt="" className="w-full h-full object-cover" /> : m.team1?.initials}
                      </div>
                      <span className="text-xs font-bold line-clamp-1">{m.team1?.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground px-2">VS</span>
                    <div className="flex items-center gap-2 flex-1 justify-end text-right">
                      <span className="text-xs font-bold line-clamp-1">{m.team2?.name}</span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary overflow-hidden">
                        {m.team2?.logo ? <img src={m.team2?.logo} alt="" className="w-full h-full object-cover" /> : m.team2?.initials}
                      </div>
                    </div>
                  </div>
                  {m.venue && (
                    <div className="text-[10px] text-muted-foreground mt-2 text-center bg-background/50 rounded-sm py-1 font-medium">
                      📍 {m.venue}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/10 border-border/50 border-dashed">
            <CardContent className="p-6 text-center text-xs text-muted-foreground">
              No upcoming matches scheduled.
            </CardContent>
          </Card>
        )}
      </div>

      {teamsSection}

      {/* RANKINGS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-4 w-4" /> Top 5 Teams
          </h2>
          <Link href="/stats">
            <div className="text-xs font-medium text-primary flex items-center hover:underline">
              View All <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>
        </div>
        {rankings.length > 0 ? (
          <Card className="border-primary/20 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase bg-muted/50 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-3 py-2 font-semibold w-8 text-center">#</th>
                    <th className="px-2 py-2 font-semibold">Team</th>
                    <th className="px-2 py-2 font-semibold text-center">P</th>
                    <th className="px-2 py-2 font-semibold text-center">W</th>
                    <th className="px-2 py-2 font-semibold text-center">L</th>
                    <th className="px-3 py-2 font-bold text-primary text-center">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rankings.map((team: any, index: number) => (
                    <tr key={team.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 text-center font-bold text-muted-foreground">{index + 1}</td>
                      <td className="px-2 py-2 flex items-center gap-2 min-w-[120px]">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[8px] text-primary shrink-0 glow-blue">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            team.initials || team.name.charAt(0)
                          )}
                        </div>
                        <span className="font-semibold text-xs line-clamp-1">{team.name}</span>
                      </td>
                      <td className="px-2 py-2 text-center text-xs text-muted-foreground">{team.played}</td>
                      <td className="px-2 py-2 text-center text-xs text-emerald-400 font-medium">{team.won}</td>
                      <td className="px-2 py-2 text-center text-xs text-red-400 font-medium">{team.lost}</td>
                      <td className="px-3 py-2 text-center text-xs font-bold text-primary">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="bg-muted/10 border-border/50 border-dashed">
            <CardContent className="p-6 text-center text-xs text-muted-foreground">
              No stats available.
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
