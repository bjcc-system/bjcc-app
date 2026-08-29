import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Users, Plus, Trash2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { TeamForm } from "./TeamForm";

export const dynamic = "force-dynamic";

export default async function AdminTeams() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) redirect("/admin/gateway");

  const allTeams = await db.select().from(teams);

  async function addTeam(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const initials = formData.get("initials") as string;
    const location = formData.get("location") as string;
    const logo = formData.get("logo") as string;
    await db.insert(teams).values({ name, initials, location, logo });
    revalidatePath("/admin/teams");
  }

  async function deleteTeam(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await db.delete(teams).where(eq(teams.id, id));
    revalidatePath("/admin/teams");
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Team Management
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add, edit and manage cricket teams
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Team Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add New Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamForm addTeamAction={addTeam} />
          </CardContent>
        </Card>

        {/* Teams List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Registered Teams ({allTeams.length})
          </h2>
          {allTeams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allTeams.map((t) => (
                <Card key={t.id} className="group relative">
                  <CardContent className="pt-4 pb-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden glow-blue">
                      {t.logo ? <img src={t.logo} alt={t.initials} className="w-full h-full object-cover" /> : (t.initials || t.name.charAt(0))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{t.name}</div>
                      {t.location && (
                        <div className="text-xs text-muted-foreground">{t.location}</div>
                      )}
                    </div>
                    <form action={deleteTeam}>
                      <input type="hidden" name="id" value={t.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No teams registered yet. Create your first team above.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
