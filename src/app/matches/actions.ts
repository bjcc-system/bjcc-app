"use server";

import { db } from "@/lib/db";
import { balls } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getMatchBalls(matchId: string) {
  const matchBalls = await db
    .select()
    .from(balls)
    .where(eq(balls.matchId, matchId))
    .orderBy(asc(balls.timestamp));
  return matchBalls;
}
