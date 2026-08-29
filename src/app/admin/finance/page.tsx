import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { finances, tournaments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { FileText, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import FinancePDFButtons from "./FinancePDFButtons";

export const dynamic = "force-dynamic";

export default async function AdminFinance() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) redirect("/admin/gateway");

  const allFinances = await db.select().from(finances).orderBy(desc(finances.date));
  const allTournaments = await db.select().from(tournaments);

  const totalIncome = allFinances.filter((f) => f.type === "INCOME").reduce((s, f) => s + f.amount, 0);
  const totalExpense = allFinances.filter((f) => f.type === "EXPENSE").reduce((s, f) => s + f.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Tournament-wise breakdown
  const tournamentFinances = allTournaments.map((t) => {
    const tFinances = allFinances.filter((f) => f.tournamentId === t.id);
    const income = tFinances.filter((f) => f.type === "INCOME").reduce((s, f) => s + f.amount, 0);
    const expense = tFinances.filter((f) => f.type === "EXPENSE").reduce((s, f) => s + f.amount, 0);
    return { ...t, income, expense, net: income - expense, transactions: tFinances };
  });

  // General (non-tournament) finances
  const generalFinances = allFinances.filter((f) => !f.tournamentId);
  const generalIncome = generalFinances.filter((f) => f.type === "INCOME").reduce((s, f) => s + f.amount, 0);
  const generalExpense = generalFinances.filter((f) => f.type === "EXPENSE").reduce((s, f) => s + f.amount, 0);

  async function addFinance(formData: FormData) {
    "use server";
    const type = formData.get("type") as string;
    const amount = parseInt(formData.get("amount") as string);
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const tournamentId = (formData.get("tournamentId") as string) || null;
    await db.insert(finances).values({
      type,
      amount,
      description,
      category,
      tournamentId: tournamentId || null,
    });
    revalidatePath("/admin/finance");
    revalidatePath("/admin");
  }

  async function deleteFinance(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await db.delete(finances).where(eq(finances.id, id));
    revalidatePath("/admin/finance");
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Finance Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track income, expenses and generate reports
          </p>
        </div>
        <FinancePDFButtons
          allFinances={JSON.parse(JSON.stringify(allFinances))}
          tournamentFinances={JSON.parse(JSON.stringify(tournamentFinances))}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netBalance={netBalance}
        />
      </div>

      <Separator />

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-t-2 border-t-emerald-500">
          <CardContent className="pt-3 pb-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Income</div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">₹{totalIncome}</div>
          </CardContent>
        </Card>
        <Card className="border-t-2 border-t-red-500">
          <CardContent className="pt-3 pb-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Expense</div>
            <div className="text-xl font-bold text-red-400 tabular-nums">₹{totalExpense}</div>
          </CardContent>
        </Card>
        <Card className={`border-t-2 ${netBalance >= 0 ? "border-t-blue-500" : "border-t-orange-500"}`}>
          <CardContent className="pt-3 pb-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</div>
            <div className="text-xl font-bold tabular-nums">₹{netBalance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Breakdown */}
      {tournamentFinances.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Tournament Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tournamentFinances.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{t.name}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {t.net >= 0 ? "+" : ""}₹{t.net}
                    </Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="text-emerald-400">In: ₹{t.income}</span>
                    <span className="text-red-400">Out: ₹{t.expense}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Transaction Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addFinance} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <select
                    name="type"
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <select
                    name="category"
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ENTRY_FEE">Entry Fee</option>
                    <option value="PRIZE">Prize Money</option>
                    <option value="SPONSORSHIP">Sponsorship</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="FOOD">Food</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (₹)</Label>
                <Input name="amount" type="number" placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input name="description" placeholder="e.g. Entry fee from Team A" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tournament (optional)</Label>
                <select
                  name="tournamentId"
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">General (No Tournament)</option>
                  {allTournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" size="sm">
                Save Transaction
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            All Transactions ({allFinances.length})
          </h2>
          <Card>
            {allFinances.length > 0 ? (
              <div className="divide-y divide-border/50">
                {allFinances.map((f) => {
                  const tName = f.tournamentId
                    ? allTournaments.find((t) => t.id === f.tournamentId)?.name
                    : null;
                  return (
                    <div
                      key={f.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-md shrink-0 ${
                            f.type === "INCOME"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {f.type === "INCOME" ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{f.description}</div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {f.category}
                            </Badge>
                            {tName && <span>• {tName}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-bold text-sm tabular-nums ${
                            f.type === "INCOME" ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {f.type === "INCOME" ? "+" : "-"}₹{f.amount}
                        </span>
                        <form action={deleteFinance}>
                          <input type="hidden" name="id" value={f.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No transactions recorded.
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
