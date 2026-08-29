"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Trophy, Users, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/matches", label: "Matches", icon: Calendar },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/stats", label: "Stats", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();
  const [hasUnreadNotice, setHasUnreadNotice] = useState(false);

  // Example logic for unread notice indicator
  useEffect(() => {
    // We will poll or check localStorage later when implementing Notices
    // For now, this is a placeholder
    const checkUnread = () => {
      const lastRead = localStorage.getItem("last_read_notice");
      const latestNotice = localStorage.getItem("latest_notice_id");
      if (latestNotice && lastRead !== latestNotice) {
        setHasUnreadNotice(true);
      } else {
        setHasUnreadNotice(false);
      }
    };
    checkUnread();
    window.addEventListener("storage", checkUnread);
    return () => window.removeEventListener("storage", checkUnread);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (item.href === "/notices") {
                  setHasUnreadNotice(false);
                  const latestId = localStorage.getItem("latest_notice_id");
                  if (latestId) localStorage.setItem("last_read_notice", latestId);
                }
              }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl text-[10px] font-medium transition-all duration-300",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive ? "drop-shadow-[0_0_8px_oklch(0.65_0.2_250)] scale-110" : ""
                  )}
                />
                {item.hasIndicator && hasUnreadNotice && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className={cn("transition-all duration-300", isActive ? "font-bold" : "")}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
