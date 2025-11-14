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

/**
 * Players table for NBA 2K26 player database
 */
export const players = mysqlTable("players", {
  id: varchar("id", { length: 64 }).primaryKey(), // NBA player ID or generated ID
  name: varchar("name", { length: 255 }).notNull(),
  overall: int("overall").notNull(), // NBA 2K26 overall rating
  team: varchar("team", { length: 100 }), // Team name
  photoUrl: text("photoUrl"), // NBA.com or 2kratings photo URL
  playerPageUrl: text("playerPageUrl"), // 2kratings player page URL
  nbaId: varchar("nbaId", { length: 64 }), // NBA.com player ID
  source: varchar("source", { length: 64 }), // Data source (nba.com, 2kratings, etc.)
  badgeCount: int("badgeCount"), // Total badge count from 2kratings
  salaryCap: int("salaryCap"), // Salary cap hit in millions (based on overall rating)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Transaction history table to track all player movements
 */
export const transactionHistory = mysqlTable("transaction_history", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }).notNull(), // Reference to players.id
  playerName: varchar("playerName", { length: 255 }).notNull(), // Denormalized for history
  fromTeam: varchar("fromTeam", { length: 100 }), // Previous team (null for new players)
  toTeam: varchar("toTeam", { length: 100 }).notNull(), // New team
  adminId: int("adminId"), // Reference to users.id who made the change
  adminName: varchar("adminName", { length: 255 }), // Denormalized for history
  transactionType: mysqlEnum("transactionType", ["trade", "signing", "release", "update"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TransactionHistory = typeof transactionHistory.$inferSelect;
export type InsertTransactionHistory = typeof transactionHistory.$inferInsert;

/**
 * Discord integration configuration table
 */
export const discordConfig = mysqlTable("discord_config", {
  id: int("id").autoincrement().primaryKey(),
  webhookUrl: text("webhookUrl").notNull(), // Discord webhook URL
  messageId: varchar("messageId", { length: 64 }), // Discord message ID to update
  websiteUrl: text("websiteUrl").notNull(), // Website URL for team links
  autoUpdateEnabled: int("autoUpdateEnabled").default(0).notNull(), // 0 = disabled, 1 = enabled
  lastUpdated: timestamp("lastUpdated"), // Last time Discord was updated
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiscordConfig = typeof discordConfig.$inferSelect;
export type InsertDiscordConfig = typeof discordConfig.$inferInsert;