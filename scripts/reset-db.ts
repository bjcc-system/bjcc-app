import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Drop existing tables
  const dropStatements = [
    "DROP TABLE IF EXISTS balls",
    "DROP TABLE IF EXISTS tournament_teams",
    "DROP TABLE IF EXISTS finances",
    "DROP TABLE IF EXISTS matches",
    "DROP TABLE IF EXISTS players",
    "DROP TABLE IF EXISTS tournaments",
    "DROP TABLE IF EXISTS notices",
    "DROP TABLE IF EXISTS teams",
  ];

  for (const stmt of dropStatements) {
    await client.execute(stmt);
    console.log(`✓ ${stmt}`);
  }

  // Read and execute migration SQL
  const sql = readFileSync("drizzle/0000_smiling_rocket_racer.sql", "utf-8");
  const statements = sql
    .split("-->")
    .map((s: string) => s.replace("statement-breakpoint", "").trim())
    .filter((s: string) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
    console.log(`✓ Created table`);
  }

  console.log("\n✅ All tables recreated successfully!");
}

main().catch(console.error);
