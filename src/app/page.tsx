import { db } from "@/lib/db";
import { matches, teams, tournaments, notices, tournamentTeams, balls } from "@/lib/db/schema";
import { desc, eq, ne, and } from "drizzle-orm";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Bell, Shield, ChevronRight, Activity, MapPin } from "lucide-react";
import { HomeRealtimeFeed } from "@/components/HomeRealtimeFeed";

export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beltala Jr Cricket Council | Live Score & Tournaments",
  description: "Get real-time live scores, upcoming match fixtures, and tournament updates for Beltala Jr Cricket Council (BJCC).",
  keywords: ["BJCC live score", "Beltala cricket live", "Beltala junior cricket", "local cricket tournament", "cricket scores"],
};

export default async function HomePage() {
  // 1. Fetch Current/Latest Tournament
  const allTournaments = await db.select().from(tournaments).orderBy(desc(tournaments.createdAt));
  const currentTournament = allTournaments.find(t => t.status === "ONGOING") || allTournaments[0];
  
  let currentTournamentTeams: any[] = [];
  if (currentTournament) {
    const ttMaps = await db.select().from(tournamentTeams).where(eq(tournamentTeams.tournamentId, currentTournament.id));
    const teamIds = ttMaps.map(tt => tt.teamId);
    if (teamIds.length > 0) {
      const t = await db.select().from(teams);
      const filtered = t.filter(team => teamIds.includes(team.id));
      currentTournamentTeams = filtered
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
    }
  }

  const allTeamsQuery = await db.select().from(teams);
  const allTeams = allTeamsQuery
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  const teamMap = new Map(allTeamsQuery.map(t => [t.id, t]));

  // 2. Fetch Matches
  const allMatches = await db.select().from(matches).orderBy(desc(matches.createdAt));
  const enrichedMatches = allMatches.map(m => ({
    ...m,
    team1: teamMap.get(m.team1Id),
    team2: teamMap.get(m.team2Id),
    tournamentName: m.tournamentId ? allTournaments.find(t => t.id === m.tournamentId)?.name : null
  }));

  const liveMatchRaw = enrichedMatches.find(m => ["LIVE", "TOSS", "INNINGS_BREAK"].includes(m.status));
  let liveMatch = liveMatchRaw ? { ...liveMatchRaw, score: { totalRuns: 0, wickets: 0, oversStr: "0.0", crr: "0.00", recentBalls: [] as any[] } } : null;

  if (liveMatch && liveMatch.status === "LIVE") {
    const innings = liveMatch.currentInnings || 1;
    const matchBalls = await db
      .select()
      .from(balls)
      .where(and(eq(balls.matchId, liveMatch.id), eq(balls.innings, innings), eq(balls.isUndone, false)));
    
    let totalRuns = 0, wickets = 0, legalBalls = 0;
    for (const b of matchBalls) {
      totalRuns += b.runs + b.extras;
      if (b.isWicket) wickets++;
      if (b.extraType !== "WIDE" && b.extraType !== "NO_BALL") legalBalls++;
    }
    
    const recentBalls = await db
      .select()
      .from(balls)
      .where(and(eq(balls.matchId, liveMatch.id), eq(balls.innings, innings), eq(balls.isUndone, false)))
      .orderBy(desc(balls.timestamp))
      .limit(10);
    
    let target: number | null = null;
    let runsNeeded: number | null = null;
    let ballsLeft: number | null = null;

    if (innings === 2) {
      const firstInningsBalls = await db
        .select()
        .from(balls)
        .where(and(eq(balls.matchId, liveMatch.id), eq(balls.innings, 1), eq(balls.isUndone, false)));
      
      const firstInningsScore = firstInningsBalls.reduce((sum, b) => sum + b.runs + b.extras, 0);
      target = firstInningsScore + 1;
      runsNeeded = target - totalRuns;
      ballsLeft = (liveMatch.totalOvers * 6) - legalBalls;
    }

    liveMatch.score = {
      totalRuns,
      wickets,
      oversStr: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      crr: legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : "0.00",
      recentBalls: recentBalls.reverse() as any[],
      target,
      runsNeeded,
      ballsLeft,
    } as any;
  }
  const lastMatch = enrichedMatches.find(m => m.status === "COMPLETED");
  const upcomingMatches = enrichedMatches
    .filter(m => m.status === "SCHEDULED")
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3);

  // 3. Fetch Notices
  const latestNotices = await db.select().from(notices).orderBy(desc(notices.createdAt)).limit(3);

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        
        {/* HERO SECTION */}
        <div className="pt-2 pb-4 text-center space-y-4">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 tracking-widest text-[10px]">
            BELTALA JR CRICKET COUNCIL
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient from-primary to-blue-400">
            {currentTournament ? currentTournament.name : "BJCC Cricket"}
          </h1>
          {currentTournamentTeams.length > 0 && (
            <div className="flex justify-center gap-2 flex-wrap max-w-sm mx-auto">
              {currentTournamentTeams.map((team, idx) => (
                <div key={idx} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center glow-blue text-xs font-bold text-primary shadow-sm" title={team.name}>
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    team.initials || team.name.charAt(0)
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REALTIME FEED (Live, Last, Upcoming, Notices) */}
        <HomeRealtimeFeed 
          initialLiveMatch={liveMatch} 
          initialLastMatch={lastMatch}
          initialUpcomingMatches={upcomingMatches}
          initialNotices={latestNotices}
        />

        {/* TEAMS MINI ROSTER */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Teams
            </h2>
            <Link href="/teams" className="text-xs text-primary hover:underline flex items-center">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {(currentTournamentTeams.length > 0 ? currentTournamentTeams : allTeams).length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {(currentTournamentTeams.length > 0 ? currentTournamentTeams : allTeams).map(t => (
                <div key={t.id} className="snap-start shrink-0 flex flex-col items-center gap-1.5 w-16">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-primary overflow-hidden">
                    {t.logo ? <img src={t.logo} alt="" className="w-full h-full rounded-full object-cover" /> : t.initials}
                  </div>
                  <div className="text-[9px] text-center font-medium truncate w-full">{t.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/10 border-border/50 border-dashed">
              <CardContent className="p-6 text-center text-xs text-muted-foreground">
                No teams registered yet.
              </CardContent>
            </Card>
          )}
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
