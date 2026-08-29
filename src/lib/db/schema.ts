import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// ─── TEAMS ───────────────────────────────────────────────
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  initials: text("initials").notNull().default(""),
  logo: text("logo").default(""), // URL to logo image
  location: text("location").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ─── PLAYERS ─────────────────────────────────────────────
export const players = sqliteTable("players", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
  role: text("role").notNull().default("BATSMAN"), // BATSMAN, BOWLER, ALL_ROUNDER, WK
  matches: integer("matches").default(0),
  runs: integer("runs").default(0),
  wickets: integer("wickets").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ─── TOURNAMENTS ─────────────────────────────────────────
export const tournaments = sqliteTable("tournaments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  date: text("date").default(""),           // e.g. "2024-12-15"
  venue: text("venue").default(""),
  type: text("type").notNull().default("SHORT"), // SHORT, LONG
  championsPrize: integer("champions_prize").notNull().default(0),
  runnersUpPrize: integer("runners_up_prize").notNull().default(0),
  status: text("status").notNull().default("UPCOMING"), // UPCOMING, ONGOING, COMPLETED
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ─── TOURNAMENT ↔ TEAMS (join table) ─────────────────────
export const tournamentTeams = sqliteTable(
  "tournament_teams",
  {
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tournamentId, table.teamId] })]
);

// ─── MATCHES ─────────────────────────────────────────────
export const matches = sqliteTable("matches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  matchType: text("match_type").notNull().default("NORMAL"), // TOURNAMENT, NORMAL
  tournamentId: text("tournament_id").references(() => tournaments.id, { onDelete: "set null" }),
  matchNumber: integer("match_number"),       // only for tournament matches
  totalOvers: integer("total_overs").notNull().default(10),
  stage: text("stage").default(""),            // LEAGUE, QUARTER, SEMI, FINAL
  team1Id: text("team1_id").references(() => teams.id).notNull(),
  team2Id: text("team2_id").references(() => teams.id).notNull(),
  tossWinnerId: text("toss_winner_id").references(() => teams.id),
  tossDecision: text("toss_decision"),        // BAT, BOWL
  battingFirstId: text("batting_first_id").references(() => teams.id),
  date: text("match_date").default(""),        // for normal matches
  time: text("match_time").default(""),        // for normal matches
  venue: text("match_venue").default(""),      // for normal matches
  status: text("status").notNull().default("SCHEDULED"), // SCHEDULED, TOSS, LIVE, INNINGS_BREAK, DELAYED, COMPLETED
  currentInnings: integer("current_innings").default(1), // 1 or 2
  winnerId: text("winner_id").references(() => teams.id),
  resultDesc: text("result_desc"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ─── BALLS (ball-by-ball) ────────────────────────────────
export const balls = sqliteTable("balls", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  innings: integer("innings").notNull().default(1),   // 1 or 2
  overNumber: integer("over_number").notNull(),       // 0-indexed
  ballNumber: integer("ball_number").notNull(),       // 1-6 (legal deliveries)
  runs: integer("runs").notNull().default(0),         // runs off bat
  extras: integer("extras").notNull().default(0),     // extra runs
  extraType: text("extra_type"),                       // WIDE, NO_BALL, BYE, LEG_BYE, null
  isWicket: integer("is_wicket", { mode: "boolean" }).default(false),
  wicketType: text("wicket_type"),                     // BOWLED, CAUGHT, RUN_OUT, null
  isUndone: integer("is_undone", { mode: "boolean" }).default(false),
  timestamp: integer("timestamp", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ─── FINANCES ────────────────────────────────────────────
export const finances = sqliteTable("finances", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(),               // INCOME, EXPENSE
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").default("OTHER"), // ENTRY_FEE, PRIZE, SPONSORSHIP, EQUIPMENT, FOOD, OTHER
  tournamentId: text("tournament_id").references(() => tournaments.id, { onDelete: "set null" }),
  date: integer("date", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ─── NOTICES ─────────────────────────────────────────────
export const notices = sqliteTable("notices", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isImportant: integer("is_important", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});
