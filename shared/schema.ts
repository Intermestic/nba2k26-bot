import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  int,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

export const teams = mysqlTable("teams", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 10 }).notNull(),
  conference: varchar("conference", { length: 20 }).notNull(), // Eastern or Western
  division: varchar("division", { length: 50 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const players = mysqlTable("players", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  position: varchar("position", { length: 20 }).notNull(), // PG, SG, SF, PF, C
  teamId: int("team_id").references(() => teams.id),
  height: varchar("height", { length: 20 }), // e.g., "6'7"
  weight: int("weight"), // in pounds
  age: int("age"),
  jerseyNumber: int("jersey_number"),
  college: varchar("college", { length: 100 }),
  country: varchar("country", { length: 100 }).default("USA"),
  draftYear: int("draft_year"),
  draftRound: int("draft_round"),
  draftPick: int("draft_pick"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => new Date()),
});

export const contracts = mysqlTable("contracts", {
  id: int("id").primaryKey().autoincrement(),
  playerId: int("player_id")
    .notNull()
    .references(() => players.id),
  teamId: int("team_id")
    .notNull()
    .references(() => teams.id),
  contractType: varchar("contract_type", { length: 50 }).notNull(), // Free Agent, Trade, Sign-and-Trade, etc.
  signedDate: datetime("signed_date").notNull(),
  yearsLength: int("years_length"), // contract length in years
  totalValue: int("total_value"), // total contract value in millions
  annualValue: int("annual_value"), // annual average value in millions
  isTwoWay: boolean("is_two_way").default(false),
  notes: text("notes"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const playerStats = mysqlTable("player_stats", {
  id: int("id").primaryKey().autoincrement(),
  playerId: int("player_id")
    .notNull()
    .references(() => players.id),
  season: varchar("season", { length: 20 }).notNull(), // e.g., "2024-25"
  gamesPlayed: int("games_played").default(0),
  pointsPerGame: int("points_per_game").default(0),
  reboundsPerGame: int("rebounds_per_game").default(0),
  assistsPerGame: int("assists_per_game").default(0),
  stealsPerGame: int("steals_per_game").default(0),
  blocksPerGame: int("blocks_per_game").default(0),
  fieldGoalPct: int("field_goal_pct").default(0), // stored as integer (e.g., 45 for 45%)
  threePointPct: int("three_point_pct").default(0),
  freeThrowPct: int("free_throw_pct").default(0),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Bot metrics for tracking uptime, command usage, and health
export const botMetrics = mysqlTable("bot_metrics", {
  id: int("id").primaryKey().autoincrement(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // 'uptime', 'command', 'error', 'health'
  metricName: varchar("metric_name", { length: 100 }).notNull(), // command name, error type, etc.
  metricValue: int("metric_value").notNull(), // count, duration in seconds, etc.
  metadata: text("metadata"), // JSON string for additional data
  recordedAt: datetime("recorded_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Monitoring alerts configuration and status
export const monitoringAlerts = mysqlTable("monitoring_alerts", {
  id: int("id").primaryKey().autoincrement(),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // 'bot_offline', 'high_error_rate', etc.
  isEnabled: boolean("is_enabled").default(true),
  webhookUrl: text("webhook_url"), // Discord webhook URL
  alertFrequency: varchar("alert_frequency", { length: 20 }).default("immediate"), // 'immediate', '5min', '15min', '1hr'
  lastTriggered: datetime("last_triggered"),
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'paused', 'error'
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => new Date()),
});


