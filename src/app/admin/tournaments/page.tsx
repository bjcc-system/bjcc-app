import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tournaments, tournamentTeams, teams } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Trophy, Plus, Trash2, MapPin, CalendarDays, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AdminTournaments() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) redirect("/admin/gateway");

  const allTournaments = await db.select().from(tournaments).orderBy(desc(tournaments.createdAt));
  const allTeams = await db.select().from(teams);
  // Fetch tournament-team links
  const allTournamentTeams = await db.select().from(tournamentTeams);

  async function addTournament(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const date = formData.get("date") as string;
    const venue = formData.get("venue") as string;
    const type = formData.get("type") as string;
    const championsPrize = parseInt(formData.get("championsPrize") as string) || 0;
    const runnersUpPrize = parseInt(formData.get("runnersUpPrize") as string) || 0;
    const selectedTeams = formData.getAll("teams") as string[];

    const [inserted] = await db
      .insert(tournaments)
      .values({ name, date, venue, type, championsPrize, runnersUpPrize })
      .returning({ id: tournaments.id });

    if (selectedTeams.length > 0 && inserted) {
      await db.insert(tournamentTeams).values(
        selectedTeams.map((teamId) => ({
          tournamentId: inserted.id,
          teamId,
        }))
      );
    }

    revalidatePath("/admin/tournaments");
  }

  async function deleteTournament(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await db.delete(tournamentTeams).where(eq(tournamentTeams.tournamentId, id));
    await db.delete(tournaments).where(eq(tournaments.id, id));
    revalidatePath("/admin/tournaments");
  }

  async function toggleStatus(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const currentStatus = formData.get("currentStatus") as string;
    const newStatus = currentStatus === "SCHEDULED" ? "ONGOING" : "SCHEDULED";
    await db.update(tournaments).set({ status: newStatus }).where(eq(tournaments.id, id));
    revalidatePath("/admin/tournaments");
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Tournament Management
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create and manage tournaments
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Tournament Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Tournament
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addTournament} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tournament Name</Label>
                <Input name="name" placeholder="e.g. BJCC Premier League" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input name="date" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <select
                    name="type"
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Short Pitch">Short Pitch</option>
                    <option value="Short to Long">Short to Long</option>
                    <option value="Long to Long">Long to Long</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Venue</Label>
                <Input name="venue" placeholder="e.g. Beltala Ground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Champions Prize (₹)</Label>
                  <Input name="championsPrize" type="number" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Runners-up (₹)</Label>
                  <Input name="runnersUpPrize" type="number" placeholder="0" />
                </div>
              </div>

              {/* Team Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs">Select Teams</Label>
                <div className="max-h-32 overflow-y-auto border border-border rounded-md p-2 space-y-1.5">
                  {allTeams.length > 0 ? (
                    allTeams.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          name="teams"
                          value={t.id}
                          className="h-3.5 w-3.5 rounded border-border accent-primary"
                        />
                        <span className="font-medium">{t.initials || t.name.charAt(0)}</span>
                        <span className="text-muted-foreground">{t.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No teams registered</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" size="sm">
                Create Tournament
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tournament List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            All Tournaments ({allTournaments.length})
          </h2>
          {allTournaments.length > 0 ? (
            <div className="space-y-3">
              {allTournaments.map((t) => {
                const tTeams = allTournamentTeams
                  .filter((tt) => tt.tournamentId === t.id)
                  .map((tt) => allTeams.find((team) => team.id === tt.teamId)?.initials || "?");

                return (
                  <Card key={t.id} className="group relative">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{t.name}</h3>
                            <form action={toggleStatus}>
                              <input type="hidden" name="id" value={t.id} />
                              <input type="hidden" name="currentStatus" value={t.status || "SCHEDULED"} />
                              <button type="submit" className="transition-transform hover:scale-105 active:scale-95">
                                <Badge
                                  variant={
                                    t.status === "ONGOING"
                                      ? "default"
                                      : t.status === "COMPLETED"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className={`text-[10px] cursor-pointer ${t.status === "ONGOING" ? "animate-pulse" : ""}`}
                                >
                                  {t.status === "ONGOING" ? "RUNNING" : t.status === "SCHEDULED" ? "UPCOMING" : t.status}
                                </Badge>
                              </button>
                            </form>
                            <Badge variant="outline" className="text-[10px]">
                              {t.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {t.date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {t.date}
                              </span>
                            )}
                            {t.venue && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {t.venue}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-emerald-400">🏆 ₹{t.championsPrize}</span>
                            <span className="text-blue-400">🥈 ₹{t.runnersUpPrize}</span>
                          </div>
                          {tTeams.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                              {tTeams.map((init, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5">
                                  {init}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <form action={deleteTournament}>
                            <input type="hidden" name="id" value={t.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No tournaments created yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
