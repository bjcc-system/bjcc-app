"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MapPin } from "lucide-react";
import Link from "next/link";

export function LiveScorecard({ initialLiveMatch }: { initialLiveMatch: any }) {
  const [liveMatch, setLiveMatch] = useState(initialLiveMatch);

  useEffect(() => {
    if (!liveMatch) return; // Only poll if there's an active live match to begin with, or we could poll constantly. Let's poll constantly to catch when a match starts.

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/live-score", { next: { revalidate: 0 } });
        if (res.ok) {
          const data = await res.json();
          setLiveMatch(data.liveMatch);
        }
      } catch (err) {
        console.error("Failed to fetch live score", err);
      }
    }, 3000); // 3 seconds real-time feel

    return () => clearInterval(interval);
  }, [liveMatch]);

  // If there's NO live match ever, or it ended, we might want to still poll but hide it.
  // We'll run the interval above anyway if we want to catch a new match, but let's 
  // ensure we handle `null` gracefully.

  // Actually, to catch new matches without reload, we should always run the interval
  useEffect(() => {
    if (liveMatch) return; // The other effect handles it when truthy
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/live-score", { next: { revalidate: 0 } });
        if (res.ok) {
          const data = await res.json();
          if (data.liveMatch) setLiveMatch(data.liveMatch);
        }
      } catch (err) {}
    }, 10000); // check every 10s if no live match currently
    return () => clearInterval(interval);
  }, [liveMatch]);

  if (!liveMatch || liveMatch.status !== "LIVE") return null;

  return (
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
            <div className="text-3xl font-black tabular-nums tracking-tight">
              {liveMatch.score?.totalRuns || 0}<span className="text-xl text-muted-foreground">/{liveMatch.score?.wickets || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">
              Overs: <span className="text-foreground">{liveMatch.score?.oversStr || "0.0"}</span>
            </div>
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
              {liveMatch.score.recentBalls.map((b: any) => {
                const isBoundary = b.runs === 4 || b.runs === 6;
                const isWicket = b.isWicket;
                const isExtra = b.extras > 0;
                
                let display = b.runs.toString();
                if (isWicket) display = "W";
                else if (b.extraType === "WIDE") display = `${b.extras}wd`;
                else if (b.extraType === "NO_BALL") display = `${b.runs}nb`;
                else if (b.runs === 0) display = "•";

                return (
                  <div 
                    key={b.id} 
                    className={`min-w-[28px] h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
                      ${isWicket ? 'bg-red-500 text-white' : 
                        isBoundary ? 'bg-emerald-500 text-white' : 
                        isExtra ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'}`}
                  >
                    {display}
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
  );
}
