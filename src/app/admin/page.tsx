import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { finances, teams, tournaments, matches } from "@/lib/db/schema";
import Link from "next/link";
import { TrendingUp, Users, Trophy, Activity, FileText, Calendar, ChevronRight, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) redirect("/admin/gateway");

  const allTeams = await db.select().from(teams);
  const allTournaments = await db.select().from(tournaments);
  const allMatches = await db.select().from(matches);
  const allFinances = await db.select().from(finances);

  const totalIncome = allFinances.filter((f) => f.type === "INCOME").reduce((s, f) => s + f.amount, 0);
  const totalExpense = allFinances.filter((f) => f.type === "EXPENSE").reduce((s, f) => s + f.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const stats = [
    {
      label: "Council Fund",
      value: `₹${netBalance}`,
      sub: `In: ₹${totalIncome} · Out: ₹${totalExpense}`,
      icon: TrendingUp,
      color: netBalance >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Teams",
      value: allTeams.length.toString(),
      sub: "Registered",
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Tournaments",
      value: allTournaments.length.toString(),
      sub: "Created",
      icon: Trophy,
      color: "text-yellow-400",
    },
    {
      label: "Matches",
      value: allMatches.length.toString(),
      sub: "Total",
      icon: Calendar,
      color: "text-blue-400",
    },
  ];

  const quickActions = [
    { href: "/admin/scorer", label: "Launch Live Scorer", icon: Activity, accent: true },
    { href: "/admin/teams", label: "Manage Teams", icon: Users },
    { href: "/admin/matches", label: "Manage Matches", icon: Calendar },
    { href: "/admin/tournaments", label: "Manage Tournaments", icon: Trophy },
    { href: "/admin/finance", label: "Finance & Reports", icon: FileText },
  ];

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">BJCC Admin Overview</p>
      </div>

      <Separator />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </span>
              </div>
              <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card
                className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                  a.accent ? "border-red-500/20" : ""
                }`}
              >
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {a.accent ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                    ) : (
                      <a.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-sm font-medium ${a.accent ? "text-red-400" : ""}`}>
                      {a.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
