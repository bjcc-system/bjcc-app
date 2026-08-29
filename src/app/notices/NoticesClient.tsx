"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, Calendar } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

type Notice = {
  id: string;
  title: string;
  content: string;
  isImportant: boolean | null;
  createdAt: Date | null;
};

export default function NoticesClient({ notices }: { notices: Notice[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (notices.length > 0) {
      const latestNoticeId = notices[0].id;
      const lastReadNoticeId = localStorage.getItem("last_read_notice");

      // Set the latest notice for the navbar to check
      localStorage.setItem("latest_notice_id", latestNoticeId);

      if (lastReadNoticeId !== latestNoticeId) {
        // New notice detected! Play discord-like sound
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignore autoplay restrictions error
        });
        
        // Mark as read immediately when on this page
        localStorage.setItem("last_read_notice", latestNoticeId);
        // Trigger a storage event so BottomNav updates instantly
        window.dispatchEvent(new Event("storage"));
      }
    }
  }, [notices]);

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notice Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official announcements and updates from BJCC
          </p>
        </div>

        {notices.length > 0 ? (
          <div className="space-y-4">
            {notices.map((notice) => (
              <Card 
                key={notice.id} 
                className={`cursor-pointer transition-all duration-300 ${
                  expandedId === notice.id 
                    ? "ring-2 ring-primary/50 shadow-lg shadow-primary/10" 
                    : "hover:border-primary/30 hover:bg-muted/20"
                }`}
                onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
              >
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base leading-snug">
                      {notice.title}
                    </CardTitle>
                    {notice.isImportant && (
                      <Badge variant="destructive" className="shrink-0 text-[10px] gap-1 animate-pulse-live">
                        <AlertCircle className="h-3 w-3" /> Important
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    }) : "Recent"}
                  </div>
                </CardHeader>
                {expandedId === notice.id && (
                  <CardContent className="pt-2 pb-4 text-sm whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 duration-300 text-foreground/90">
                    {notice.content}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            No notices available at the moment.
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
