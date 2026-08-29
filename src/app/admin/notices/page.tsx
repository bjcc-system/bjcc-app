import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { notices } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Bell, Plus, AlertTriangle, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminNotices() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) redirect("/admin/gateway");

  const allNotices = await db
    .select()
    .from(notices)
    .orderBy(desc(notices.createdAt));

  async function addNotice(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const isImportant = formData.get("isImportant") === "on";
    await db.insert(notices).values({ title, content, isImportant });
    revalidatePath("/admin/notices");
    revalidatePath("/");
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-yellow-500" />
            Notice Board
          </h1>
          <p className="text-sm text-muted-foreground">
            Post announcements and rules
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Notice Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" /> New Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addNotice} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Tournament Announcement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Write your notice here..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isImportant"
                  name="isImportant"
                  className="h-4 w-4 rounded border-border bg-transparent accent-red-500"
                />
                <Label htmlFor="isImportant" className="text-sm cursor-pointer">
                  Mark as Important
                </Label>
              </div>
              <Button type="submit" className="w-full">
                Post Notice
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notices List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">All Notices</h2>
          {allNotices.length > 0 ? (
            allNotices.map((notice) => (
              <Card key={notice.id} className="relative overflow-hidden">
                {notice.isImportant && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
                )}
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                          notice.isImportant
                            ? "bg-red-500/10 text-red-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {notice.isImportant ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Megaphone className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {notice.title}
                          {notice.isImportant && (
                            <Badge variant="destructive" className="text-[10px]">
                              Important
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {notice.content}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {notice.createdAt
                            ? new Date(notice.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No notices posted yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
