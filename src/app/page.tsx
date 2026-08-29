import { db } from "@/lib/db";
import { matches, teams, tournaments, notices, tournamentTeams } from "@/lib/db/schema";
import { desc, eq, ne, and } from "drizzle-orm";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Bell, Shield, ChevronRight, Activity } from "lucide-react";

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

  const liveMatch = enrichedMatches.find(m => ["LIVE", "TOSS", "INNINGS_BREAK"].includes(m.status));
  const lastMatch = enrichedMatches.find(m => m.status === "COMPLETED");
  const upcomingMatches = enrichedMatches.filter(m => m.status === "SCHEDULED").slice(0, 3);

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
          <Card className="border-red-500/30 bg-red-500/5 glow-red overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse"></div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="destructive" className="animate-pulse-live text-[10px] gap-1">
                  <Activity className="h-3 w-3" /> LIVE
                </Badge>
                <div className="text-[10px] text-muted-foreground uppercase font-medium">
                  {liveMatch.tournamentName || "Normal Match"}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-sm font-bold truncate">{liveMatch.team1?.initials || liveMatch.team1?.name}</div>
                </div>
                <div className="text-xs font-bold text-muted-foreground px-4">VS</div>
                <div className="text-center flex-1">
                  <div className="text-sm font-bold truncate">{liveMatch.team2?.initials || liveMatch.team2?.name}</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link href="/matches">
                  <Badge variant="secondary" className="hover:bg-primary/20 transition-colors">
                    View Live Scorecard &rarr;
                  </Badge>
                </Link>
              </div>
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
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                        {m.team1?.initials}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">v</span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                        {m.team2?.initials}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold">{m.date || "TBD"}</div>
                      <div className="text-[10px] text-muted-foreground">{m.time || m.venue || "TBD"}</div>
                    </div>
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
          {allTeams.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {allTeams.slice(0, 7).map(t => (
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
