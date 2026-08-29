"use server";

import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMatch(formData: FormData) {
  const matchType = formData.get("matchType") as string;
  const tournamentId = (formData.get("tournamentId") as string) || null;
  const matchNumber = formData.get("matchNumber")
    ? parseInt(formData.get("matchNumber") as string)
    : null;
  const totalOvers = parseInt(formData.get("totalOvers") as string) || 10;
  const stage = (formData.get("stage") as string) || null;
  const team1Id = formData.get("team1Id") as string;
  const team2Id = formData.get("team2Id") as string;
  const date = (formData.get("date") as string) || null;
  const time = (formData.get("time") as string) || null;
  const venue = (formData.get("venue") as string) || null;

  await db.insert(matches).values({
    matchType,
    tournamentId: matchType === "TOURNAMENT" ? tournamentId : null,
    matchNumber: matchType === "TOURNAMENT" ? matchNumber : null,
    totalOvers,
    stage: matchType === "TOURNAMENT" ? stage : null,
    team1Id,
    team2Id,
    date: date || "",
    time: time || "",
    venue: venue || "",
  });

  revalidatePath("/admin/matches");
  redirect("/admin/matches");
}

export async function deleteMatch(formData: FormData) {
  const id = formData.get("id") as string;
  await db.delete(matches).where(eq(matches.id, id));
  revalidatePath("/admin/matches");
}
