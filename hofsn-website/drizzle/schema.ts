import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Playoff games and series tracking
export const playoffGames = mysqlTable("playoff_games", {
  id: int("id").autoincrement().primaryKey(),
  season: varchar("season", { length: 10 }).notNull(), // e.g., "Season 17"
  round: mysqlEnum("round", ["first", "second", "conference_finals", "finals"]).notNull(),
  matchupId: varchar("matchup_id", { length: 50 }).notNull(), // e.g., "R1-1v16"
  gameNumber: int("game_number").notNull(), // 1, 2, 3, etc.
  homeTeam: varchar("home_team", { length: 100 }).notNull(),
  awayTeam: varchar("away_team", { length: 100 }).notNull(),
  homeScore: int("home_score"),
  awayScore: int("away_score"),
  winner: varchar("winner", { length: 100}),
  playedAt: timestamp("played_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const playoffSeries = mysqlTable("playoff_series", {
  id: int("id").autoincrement().primaryKey(),
  season: varchar("season", { length: 10 }).notNull(),
  round: mysqlEnum("round", ["first", "second", "conference_finals", "finals"]).notNull(),
  matchupId: varchar("matchup_id", { length: 50 }).notNull().unique(),
  seed1: int("seed1").notNull(),
  team1: varchar("team1", { length: 100 }).notNull(),
  seed2: int("seed2").notNull(),
  team2: varchar("team2", { length: 100 }).notNull(),
  team1Wins: int("team1_wins").default(0).notNull(),
  team2Wins: int("team2_wins").default(0).notNull(),
  seriesWinner: varchar("series_winner", { length: 100 }),
  isComplete: int("is_complete").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PlayoffGame = typeof playoffGames.$inferSelect;
export type InsertPlayoffGame = typeof playoffGames.$inferInsert;
export type PlayoffSeries = typeof playoffSeries.$inferSelect;
export type InsertPlayoffSeries = typeof playoffSeries.$inferInsert;

// Highlight cards for homepage carousel and highlights page
export const highlightCards = mysqlTable("highlight_cards", {
  id: int("id").autoincrement().primaryKey(),
  image: varchar("image", { length: 500 }).notNull(), // Image path or URL
  title: varchar("title", { length: 200 }).notNull(),
  stat: varchar("stat", { length: 100 }), // e.g., "96-93", "SWEEP", "28.5 PPG"
  category: varchar("category", { length: 300 }), // e.g., "Rockets Lead 1-0", "Season 17 MVP"
  link: varchar("link", { length: 500 }), // Link to detail page
  linkText: varchar("link_text", { length: 100 }), // e.g., "View Game Recap"
  displayLocation: mysqlEnum("display_location", ["homepage", "highlights", "both"]).default("both").notNull(),
  cardType: mysqlEnum("card_type", ["playoff", "award", "stat_leader", "other"]).default("other").notNull(),
  priority: int("priority").default(0).notNull(), // Higher = appears first
  isActive: int("is_active").default(1).notNull(), // 0 = hidden, 1 = visible
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type HighlightCard = typeof highlightCards.$inferSelect;
export type InsertHighlightCard = typeof highlightCards.$inferInsert;