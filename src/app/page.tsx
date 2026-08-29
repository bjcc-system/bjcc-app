import { db } from "@/lib/db";
import { matches, teams, tournaments, notices, tournamentTeams, balls } from "@/lib/db/schema";
import { desc, eq, ne, and } from "drizzle-orm";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Bell, Shield, ChevronRight, Activity, MapPin } from "lucide-react";

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
  let liveMatch = liveMatchRaw ? { ...liveMatchRaw, score: { totalRuns: 0, wickets: 0, oversStr: "0.0", crr: "0.00" } } : null;

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
    
    liveMatch.score = {
      totalRuns,
      wickets,
      oversStr: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      crr: legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : "0.00",
      recentBalls: recentBalls.reverse()
    };
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

        {/* LIVE MATCH */}
        {liveMatch && (
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
                  {liveMatch.status === "LIVE" ? (
                    <>
                      <div className="text-3xl font-black tabular-nums tracking-tight">
                        {liveMatch.score.totalRuns}<span className="text-xl text-muted-foreground">/{liveMatch.score.wickets}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">
                        Overs: <span className="text-foreground">{liveMatch.score.oversStr}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-bold text-muted-foreground">VS</div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
                    {liveMatch.team2?.logo ? <img src={liveMatch.team2?.logo} alt="" className="w-full h-full object-cover" /> : liveMatch.team2?.initials}
                  </div>
                  <div className="text-xs font-bold text-center line-clamp-1">{liveMatch.team2?.name}</div>
                </div>
              </div>

              {liveMatch.status === "LIVE" && liveMatch.score.recentBalls && liveMatch.score.recentBalls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Balls</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CRR: {liveMatch.score.crr}</span>
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
                  <div className="text-sm font-bold">{lastMatch.team1?.name}</div>
                  <div className="text-xs text-muted-foreground">VS</div>
                  <div className="text-sm font-bold">{lastMatch.team2?.name}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 text-center">
                  <span className="text-xs font-medium text-emerald-400">
                    {lastMatch.resultDesc}
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
            <Link href="/matches" className="text-xs text-primary hover:underline flex items-center">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="grid gap-2">
              {upcomingMatches.map(m => (
                <Card key={m.id} className="bg-muted/10 border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        {m.tournamentName || "Friendly"} {m.matchNumber ? `• M-${m.matchNumber}` : ""}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3" />
                        {m.date ? `${m.date} ${m.time ? `• ${m.time}` : ""}` : "TBD"}
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
                No upcoming fixtures scheduled.
              </CardContent>
            </Card>
          )}
        </div>

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

        {/* NOTICES MINI */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Bell className="h-4 w-4" /> Latest Notices
            </h2>
            <Link href="/notices" className="text-xs text-primary hover:underline flex items-center">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {latestNotices.length > 0 ? (
            <div className="grid gap-2">
              {latestNotices.map(n => (
                <Link key={n.id} href="/notices">
                  <Card className="hover:bg-muted/30 transition-colors border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        {n.isImportant && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />}
                        <div className="text-sm font-medium line-clamp-1">{n.title}</div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recent"}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/10 border-border/50 border-dashed">
              <CardContent className="p-6 text-center text-xs text-muted-foreground">
                No recent announcements.
              </CardContent>
            </Card>
          )}
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
