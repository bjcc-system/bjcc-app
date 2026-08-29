"use server";

import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { notices, matches, teams } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getLiveScore() {
  // Assume we store live match data in a hash or JSON at key "live_match"
  const data = await redis.get("live_match");
  return data;
}

export async function getLatestNotices() {
  return await db.select().from(notices).orderBy(desc(notices.createdAt)).limit(3);
}

export async function getRecentMatches() {
  return await db
    .select({
      id: matches.id,
      team1Name: db.select({ name: teams.name }).from(teams).where(eq(teams.id, matches.team1Id)).as("team1Name"),
      team2Name: db.select({ name: teams.name }).from(teams).where(eq(teams.id, matches.team2Id)).as("team2Name"),
      status: matches.status,
      resultDesc: matches.resultDesc,
    })
    .from(matches)
    .orderBy(desc(matches.createdAt))
    .limit(3);
}
