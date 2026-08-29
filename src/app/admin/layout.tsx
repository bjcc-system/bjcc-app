import { getAdminSession, destroyAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Users,
  Calendar,
  Trophy,
  FileText,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    href: "/admin/scorer",
    label: "Live Scorer",
    icon: Activity,
    accent: true,
  },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/matches", label: "Matches", icon: Calendar },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/finance", label: "Finance", icon: FileText },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await getAdminSession();

  async function handleLogout() {
    "use server";
    await destroyAdminSession();
    redirect("/admin/gateway");
  }

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      {isAuthenticated && (
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/50 bg-card/30">
          <div className="p-5 pb-4">
            <h2 className="text-base font-bold tracking-tight">BJCC Admin</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Management Dashboard
            </p>
          </div>

          <Separator className="opacity-50" />

          <nav className="flex-1 p-2 space-y-0.5 mt-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2.5 text-[13px] font-normal h-9 ${
                    item.accent
                      ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      : ""
                  }`}
                >
                  {item.accent ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  ) : (
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  )}
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <Separator className="opacity-50" />

          <div className="p-2">
            <form action={handleLogout}>
              <Button
                variant="ghost"
                type="submit"
                className="w-full justify-start gap-2.5 text-[13px] font-normal h-9 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Mobile Bottom Nav */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-around px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
                  item.accent
                    ? "text-red-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.accent ? (
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                  </div>
                ) : (
                  <item.icon className="h-5 w-5" />
                )}
                {item.label}
              </Link>
            ))}
            <form action={handleLogout}>
              <button
                type="submit"
                className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </form>
          </div>
        </nav>
      )}
    </div>
  );
}
