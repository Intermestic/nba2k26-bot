import { int, mysqlTable, varchar, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Playoff games and series tracking
 */
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
