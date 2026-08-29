"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

export function HomeMatchesUI({ initialLiveMatch, initialLastMatch }: { initialLiveMatch: any, initialLastMatch: any }) {
  const [liveMatch, setLiveMatch] = useState(initialLiveMatch);
  const [lastMatch, setLastMatch] = useState(initialLastMatch);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/live-score", { next: { revalidate: 0 } });
        if (res.ok) {
          const data = await res.json();
          setLiveMatch(data.liveMatch);
          if (data.lastMatch) {
            setLastMatch(data.lastMatch);
          }
        }
      } catch (err) {
        console.error("Failed to fetch matches", err);
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
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary overflow-hidden">
                    {lastMatch.team1?.logo ? <img src={lastMatch.team1?.logo} alt="" className="w-full h-full object-cover" /> : lastMatch.team1?.initials}
                  </div>
                  <span className="text-sm font-bold line-clamp-1">
                    {lastMatch.team1?.name} {lastMatch.winnerId === lastMatch.team1Id && "🎊🎊🎊"}
                  </span>
                </div>
                <div className="text-[10px] font-black text-muted-foreground px-2">VS</div>
                <div className="flex items-center gap-2 flex-1 justify-end text-right">
                  <span className="text-sm font-bold line-clamp-1">
                    {lastMatch.winnerId === lastMatch.team2Id && "🎊🎊🎊 "} {lastMatch.team2?.name}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary overflow-hidden">
                    {lastMatch.team2?.logo ? <img src={lastMatch.team2?.logo} alt="" className="w-full h-full object-cover" /> : lastMatch.team2?.initials}
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
    </>
  );
}
