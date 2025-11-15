import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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
  lastNotificationMessageId: varchar("lastNotificationMessageId", { length: 64 }), // Last notification message ID (for deletion)
  websiteUrl: text("websiteUrl").notNull(), // Website URL for team links
  autoUpdateEnabled: int("autoUpdateEnabled").default(0).notNull(), // 0 = disabled, 1 = enabled
  lastUpdated: timestamp("lastUpdated"), // Last time Discord was updated
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiscordConfig = typeof discordConfig.$inferSelect;
export type InsertDiscordConfig = typeof discordConfig.$inferInsert;
/**
 * Team FA coins table - tracks remaining FA coins for each team
 */
export const teamCoins = mysqlTable("team_coins", {
  id: int("id").autoincrement().primaryKey(),
  team: varchar("team", { length: 100 }).notNull().unique(), // Team name
  coinsRemaining: int("coinsRemaining").notNull().default(100), // Remaining FA coins
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamCoins = typeof teamCoins.$inferSelect;
export type InsertTeamCoins = typeof teamCoins.$inferInsert;

/**
 * FA transaction history - logs all bot-processed FA transactions
 */
export const faTransactions = mysqlTable("fa_transactions", {
  id: int("id").autoincrement().primaryKey(),
  team: varchar("team", { length: 100 }).notNull(), // Team that made the transaction
  dropPlayer: varchar("dropPlayer", { length: 255 }).notNull(), // Player that was dropped
  signPlayer: varchar("signPlayer", { length: 255 }).notNull(), // Player that was signed
  signPlayerOvr: int("signPlayerOvr"), // Overall rating of signed player
  bidAmount: int("bidAmount").notNull(), // Coins bid for the player
  adminUser: varchar("adminUser", { length: 255 }), // Discord user who approved
  coinsRemaining: int("coinsRemaining").notNull(), // Team's remaining coins after transaction
  processedAt: timestamp("processedAt").defaultNow().notNull(),
  batchId: varchar("batchId", { length: 255 }), // Batch ID for batch-processed transactions
  rolledBack: boolean("rolledBack").default(false), // Whether this transaction was rolled back
  rolledBackAt: timestamp("rolledBackAt"), // When this transaction was rolled back
  rolledBackBy: varchar("rolledBackBy", { length: 255 }), // Who rolled back this transaction
  previousTeam: varchar("previousTeam", { length: 100 }), // Player's team before transaction (for rollback)
});

export type FaTransaction = typeof faTransactions.$inferSelect;
export type InsertFaTransaction = typeof faTransactions.$inferInsert;

/**
 * FA Bids table - tracks all bids during bidding windows
 */
export const faBids = mysqlTable("fa_bids", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }), // Reference to players table
  playerName: varchar("playerName", { length: 255 }).notNull(), // Player being bid on
  dropPlayer: varchar("dropPlayer", { length: 255 }), // Player being dropped (optional)
  bidderDiscordId: varchar("bidderDiscordId", { length: 64 }).notNull(), // Discord user ID of bidder
  bidderName: varchar("bidderName", { length: 255 }), // Discord username
  team: varchar("team", { length: 100 }).notNull(), // Team making the bid
  bidAmount: int("bidAmount").notNull(), // Bid amount in coins
  windowId: varchar("windowId", { length: 64 }).notNull(), // Bidding window identifier (e.g., "2025-01-14-AM")
  messageId: varchar("messageId", { length: 64 }), // Discord message ID where bid was placed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FaBid = typeof faBids.$inferSelect;
export type InsertFaBid = typeof faBids.$inferInsert;

/**
 * Bid Windows table - tracks bidding window status
 */
export const bidWindows = mysqlTable("bid_windows", {
  id: int("id").autoincrement().primaryKey(),
  windowId: varchar("windowId", { length: 64 }).notNull().unique(), // e.g., "2025-01-14-AM" or "2025-01-14-PM"
  startTime: timestamp("startTime").notNull(), // Window start time
  endTime: timestamp("endTime").notNull(), // Window end time (11:49 AM/PM)
  status: mysqlEnum("status", ["active", "locked", "closed"]).default("active").notNull(),
  statusMessageId: varchar("statusMessageId", { length: 64 }), // Discord message ID for hourly updates
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BidWindow = typeof bidWindows.$inferSelect;
export type InsertBidWindow = typeof bidWindows.$inferInsert;

/**
 * Cap Violations table - tracks cap violation alerts and compliance
 */
export const capViolations = mysqlTable("cap_violations", {
  id: int("id").autoincrement().primaryKey(),
  team: varchar("team", { length: 100 }).notNull(), // Team that violated cap
  totalOverall: int("totalOverall").notNull(), // Total OVR when violation occurred
  overCap: int("overCap").notNull(), // Amount over cap limit
  playerCount: int("playerCount").notNull(), // Number of players on roster
  alertSent: int("alertSent").default(1).notNull(), // 1 if alert was sent, 0 if not
  resolved: int("resolved").default(0).notNull(), // 1 if team is back under cap, 0 if still over
  resolvedAt: timestamp("resolvedAt"), // When team came back under cap
  createdAt: timestamp("createdAt").defaultNow().notNull(), // When violation was detected
});

export type CapViolation = typeof capViolations.$inferSelect;
export type InsertCapViolation = typeof capViolations.$inferInsert;

/**
 * Player Name Aliases table - stores custom aliases for player name matching
 */
export const playerAliases = mysqlTable("player_aliases", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }).notNull(), // Reference to players.id
  playerName: varchar("playerName", { length: 255 }).notNull(), // Canonical player name (denormalized)
  alias: varchar("alias", { length: 255 }).notNull(), // Alias/misspelling that should match this player
  matchCount: int("matchCount").default(0).notNull(), // How many times this alias has been matched
  addedBy: int("addedBy"), // Reference to users.id who added this alias
  addedByName: varchar("addedByName", { length: 255 }), // Denormalized admin name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerAlias = typeof playerAliases.$inferSelect;
export type InsertPlayerAlias = typeof playerAliases.$inferInsert;

/**
 * Failed Player Searches table - logs unsuccessful player name searches for auto-learning
 */
export const failedSearches = mysqlTable("failed_searches", {
  id: int("id").autoincrement().primaryKey(),
  searchTerm: varchar("searchTerm", { length: 255 }).notNull(), // The search term that failed
  attemptCount: int("attemptCount").default(1).notNull(), // How many times this search has failed
  lastAttempted: timestamp("lastAttempted").defaultNow().notNull(), // Last time this search was attempted
  resolved: int("resolved").default(0).notNull(), // 1 if resolved (alias added), 0 if not
  resolvedBy: int("resolvedBy"), // Reference to users.id who resolved it
  resolvedAt: timestamp("resolvedAt"), // When it was resolved
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FailedSearch = typeof failedSearches.$inferSelect;
export type InsertFailedSearch = typeof failedSearches.$inferInsert;

/**
 * Team Assignments table - maps Discord user IDs to teams
 */
export const teamAssignments = mysqlTable("team_assignments", {
  id: int("id").autoincrement().primaryKey(),
  discordUserId: varchar("discordUserId", { length: 64 }).notNull().unique(), // Discord user ID
  discordUsername: varchar("discordUsername", { length: 255 }), // Discord username (for reference, can change)
  team: varchar("team", { length: 100 }).notNull(), // Team assigned to this user
  assignedAt: timestamp("assignedAt").defaultNow().notNull(), // When assignment was made
  assignedBy: int("assignedBy"), // Reference to users.id who made the assignment
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamAssignment = typeof teamAssignments.$inferSelect;
export type InsertTeamAssignment = typeof teamAssignments.$inferInsert;
