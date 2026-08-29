"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Finance = {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string | null;
  tournamentId: string | null;
  date: string | null;
};

type TournamentFinance = {
  id: string;
  name: string;
  income: number;
  expense: number;
  net: number;
  transactions: Finance[];
};

export default function FinancePDFButtons({
  allFinances,
  tournamentFinances,
  totalIncome,
  totalExpense,
  netBalance,
}: {
  allFinances: Finance[];
  tournamentFinances: TournamentFinance[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}) {
  async function downloadOverallPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("BJCC Finance Report", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 28);

    // Overall Stats
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Overall Summary", 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Amount (₹)"]],
      body: [
        ["Total Income", totalIncome.toString()],
        ["Total Expense", totalExpense.toString()],
        ["Net Balance", netBalance.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 64, 175] },
    });

    // Tournament breakdown
    if (tournamentFinances.length > 0) {
      const currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Tournament-wise Summary", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Tournament", "Income (₹)", "Expense (₹)", "Net (₹)"]],
        body: tournamentFinances.map((t) => [
          t.name,
          t.income.toString(),
          t.expense.toString(),
          t.net.toString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 64, 175] },
      });
    }

    doc.save("bjcc-finance-overall.pdf");
  }

  async function downloadTournamentPDF(tournament: TournamentFinance) {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${tournament.name} — Finance Report`, 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 28);

    // Summary
    autoTable(doc, {
      startY: 35,
      head: [["Metric", "Amount (₹)"]],
      body: [
        ["Total Income", tournament.income.toString()],
        ["Total Expense", tournament.expense.toString()],
        ["Net Balance", tournament.net.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 64, 175] },
    });

    // Detail
    if (tournament.transactions.length > 0) {
      const currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Transaction Details", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Type", "Category", "Description", "Amount (₹)"]],
        body: tournament.transactions.map((t) => [
          t.type,
          t.category || "OTHER",
          t.description,
          `${t.type === "INCOME" ? "+" : "-"}${t.amount}`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 64, 175] },
      });
    }

    doc.save(`bjcc-${tournament.name.replace(/\s/g, "-").toLowerCase()}-finance.pdf`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button onClick={downloadOverallPDF} variant="outline" size="sm" className="gap-1.5 text-xs">
        <Download className="h-3.5 w-3.5" /> Overall PDF
      </Button>
      {tournamentFinances.map((t) => (
        <Button
          key={t.id}
          onClick={() => downloadTournamentPDF(t)}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <Download className="h-3.5 w-3.5" /> {t.name}
        </Button>
      ))}
    </div>
  );
}
