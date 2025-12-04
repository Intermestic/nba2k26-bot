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
  height: varchar("height", { length: 10 }), // Player height (e.g., 6'5")
  photoUrl: text("photoUrl"), // NBA.com or 2kratings photo URL
  playerPageUrl: text("playerPageUrl"), // 2kratings player page URL
  nbaId: varchar("nbaId", { length: 64 }), // NBA.com player ID
  source: varchar("source", { length: 64 }), // Data source (nba.com, 2kratings, etc.)
  badgeCount: int("badgeCount"), // Total badge count from 2kratings
  salaryCap: int("salaryCap"), // Salary cap hit in millions (based on overall rating)
  isRookie: int("isRookie").default(0).notNull(), // 1 = rookie, 0 = veteran
  draftYear: int("draftYear"), // Draft year (e.g., 2025)
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
  channelId: varchar("channelId", { length: 64 }), // Discord channel ID for posting cap status
  messageId: varchar("messageId", { length: 64 }), // Discord message ID to update (Part 1/2)
  messageId2: varchar("messageId2", { length: 64 }), // Discord message ID for second embed (Part 2/2)
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
 * Upgrade Log table - tracks all player badge and attribute upgrades
 */
export const upgradeLog = mysqlTable("upgrade_log", {
  id: int("id").autoincrement().primaryKey(),
  playerName: varchar("playerName", { length: 255 }).notNull(), // Player name
  userName: varchar("userName", { length: 255 }).notNull(), // Discord username who owns the player
  date: varchar("date", { length: 20 }).notNull(), // Date of upgrade (MM/DD/YYYY)
  sourceType: varchar("sourceType", { length: 50 }).notNull(), // Voting, Welcome, Game, Rookie, OG, etc.
  sourceDetail: text("sourceDetail"), // Additional context (e.g., "Game 5 badge", "Welcomes upgrades")
  upgradeType: mysqlEnum("upgradeType", ["Badge", "Attribute"]).notNull(),
  badgeOrAttribute: varchar("badgeOrAttribute", { length: 255 }).notNull(), // Name of badge or attribute
  fromValue: varchar("fromValue", { length: 50 }), // Starting value (None, Bronze, Silver, Gold, or numeric)
  toValue: varchar("toValue", { length: 50 }).notNull(), // Ending value
  notes: text("notes"), // Admin notes about this upgrade
  flagged: int("flagged").default(0).notNull(), // 1 = flagged for review, 0 = normal
  flagReason: text("flagReason"), // Reason for flagging
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UpgradeLog = typeof upgradeLog.$inferSelect;
export type InsertUpgradeLog = typeof upgradeLog.$inferInsert;

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

/**
 * Team Assignment History table - tracks changes to team assignments
 */
export const teamAssignmentHistory = mysqlTable("team_assignment_history", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(), // Reference to teamAssignments.id
  discordUserId: varchar("discordUserId", { length: 64 }).notNull(), // Discord user ID
  previousTeam: varchar("previousTeam", { length: 100 }), // Previous team (null for new assignments)
  newTeam: varchar("newTeam", { length: 100 }).notNull(), // New team
  changedBy: int("changedBy"), // Reference to users.id who made the change
  changedByDiscordId: varchar("changedByDiscordId", { length: 64 }), // Discord ID of who made the change
  changedAt: timestamp("changedAt").defaultNow().notNull(), // When change was made
  reason: text("reason"), // Optional reason for the change
});

export type TeamAssignmentHistory = typeof teamAssignmentHistory.$inferSelect;
export type InsertTeamAssignmentHistory = typeof teamAssignmentHistory.$inferInsert;

/**
 * Match logs table to track fuzzy matching confidence scores
 */
export const matchLogs = mysqlTable("match_logs", {
  id: int("id").autoincrement().primaryKey(),
  inputName: varchar("inputName", { length: 255 }).notNull(), // Original search term
  matchedName: varchar("matchedName", { length: 255 }), // Matched player name (null if no match)
  confidenceScore: int("confidenceScore"), // Fuzzy match score (0-100)
  strategy: varchar("strategy", { length: 50 }), // Which matching strategy was used
  context: varchar("context", { length: 100 }), // Context: "trade", "fa_bid", "manual_search"
  teamFilter: varchar("teamFilter", { length: 100 }), // Team filter used (if any)
  success: boolean("success").notNull(), // Whether a match was found
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchLog = typeof matchLogs.$inferSelect;
export type InsertMatchLog = typeof matchLogs.$inferInsert;

/**
 * Player Swaps table - tracks DNA swaps and player replacements for SZN 17
 */
export const playerSwaps = mysqlTable("player_swaps", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }), // Reference to players.id (nullable if old player no longer exists)
  oldPlayerName: varchar("oldPlayerName", { length: 255 }).notNull(), // Original player name before swap
  newPlayerName: varchar("newPlayerName", { length: 255 }).notNull(), // New player name after swap
  team: varchar("team", { length: 100 }), // Team the player was on when swapped
  swapType: mysqlEnum("swapType", ["dna_swap", "player_replacement", "other"]).notNull(), // Type of swap
  swapDate: varchar("swapDate", { length: 20 }).notNull(), // Date of swap (MM/DD/YYYY)
  oldPlayerOvr: int("oldPlayerOvr"), // Overall rating of old player
  newPlayerOvr: int("newPlayerOvr"), // Overall rating of new player
  notes: text("notes"), // Admin notes about the swap
  flagged: int("flagged").default(0).notNull(), // 1 = flagged for review, 0 = normal
  flagReason: text("flagReason"), // Reason for flagging
  addedBy: int("addedBy"), // Reference to users.id who added this swap
  addedByName: varchar("addedByName", { length: 255 }), // Denormalized admin name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerSwap = typeof playerSwaps.$inferSelect;
export type InsertPlayerSwap = typeof playerSwaps.$inferInsert;

/**
 * Team Role Changes table - tracks Discord role additions/removals
 */
export const teamRoleChanges = mysqlTable("team_role_changes", {
  id: int("id").autoincrement().primaryKey(),
  discordUserId: varchar("discordUserId", { length: 64 }).notNull(), // Discord user ID
  discordUsername: varchar("discordUsername", { length: 255 }).notNull(), // Discord username at time of change
  teamName: varchar("teamName", { length: 100 }).notNull(), // Team role that changed
  action: mysqlEnum("action", ["added", "removed"]).notNull(), // Role added or removed
  changedAt: timestamp("changedAt").defaultNow().notNull(), // When change occurred
});

export type TeamRoleChange = typeof teamRoleChanges.$inferSelect;
export type InsertTeamRoleChange = typeof teamRoleChanges.$inferInsert;

/**
 * Bot Configuration table - stores general bot settings
 */
export const botConfig = mysqlTable("bot_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // Config key (e.g., "fa_bidding_enabled")
  value: text("value").notNull(), // Config value (JSON string for complex values)
  description: text("description"), // Human-readable description
  category: varchar("category", { length: 50 }), // Category for grouping (e.g., "features", "channels")
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"), // Reference to users.id
});

export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = typeof botConfig.$inferInsert;

/**
 * Message Templates table - stores customizable bot messages
 */
export const messageTemplates = mysqlTable("message_templates", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // Template key (e.g., "welcome_message")
  content: text("content").notNull(), // Message content (supports Discord markdown)
  description: text("description"), // What this template is used for
  category: varchar("category", { length: 50 }), // Category (e.g., "welcome", "notifications", "commands")
  variables: text("variables"), // JSON array of available variables (e.g., ["teamName", "userId"])
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"), // Reference to users.id
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

/**
 * Bot Commands table - stores custom command configuration
 */
export const botCommands = mysqlTable("bot_commands", {
  id: int("id").autoincrement().primaryKey(),
  command: varchar("command", { length: 100 }).notNull().unique(), // Command trigger (e.g., "!sync-team-roles")
  description: text("description").notNull(), // What the command does
  example: text("example"), // Usage example (e.g., "!update bid Curry 50")
  enabled: boolean("enabled").default(true).notNull(), // Whether command is active
  responseTemplate: text("responseTemplate"), // Response message template
  permissions: varchar("permissions", { length: 50 }), // Required permissions (e.g., "admin", "user")
  category: varchar("category", { length: 50 }), // Category (e.g., "admin", "team", "fa")
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"), // Reference to users.id
});

export type BotCommand = typeof botCommands.$inferSelect;
export type InsertBotCommand = typeof botCommands.$inferInsert;

/**
 * Scheduled Messages table - stores recurring automated messages
 */
export const scheduledMessages = mysqlTable("scheduled_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Human-readable name
  channelId: varchar("channelId", { length: 64 }).notNull(), // Discord channel ID
  message: text("message").notNull(), // Message content (supports Discord markdown)
  schedule: varchar("schedule", { length: 100 }).notNull(), // Cron expression or schedule type
  enabled: boolean("enabled").default(true).notNull(), // Whether schedule is active
  lastRun: timestamp("lastRun"), // Last execution time
  nextRun: timestamp("nextRun"), // Next scheduled execution
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"), // Reference to users.id
});

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type InsertScheduledMessage = typeof scheduledMessages.$inferInsert;

/**
 * Scheduled Message Logs table - tracks delivery attempts and success/failure
 */
export const scheduledMessageLogs = mysqlTable("scheduled_message_logs", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(), // Reference to scheduledMessages.id
  status: mysqlEnum("status", ["success", "failed", "retrying"]).notNull(),
  attemptNumber: int("attemptNumber").default(1).notNull(), // Retry attempt number
  errorMessage: text("errorMessage"), // Error details if failed
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type ScheduledMessageLog = typeof scheduledMessageLogs.$inferSelect;
export type InsertScheduledMessageLog = typeof scheduledMessageLogs.$inferInsert;

/**
 * Custom Commands table - user-created bot commands
 */
export const customCommands = mysqlTable("custom_commands", {
  id: int("id").autoincrement().primaryKey(),
  trigger: varchar("trigger", { length: 100 }).notNull().unique(), // Command trigger (e.g., "!rules")
  response: text("response").notNull(), // Command response (supports variables and Discord markdown)
  responseType: mysqlEnum("responseType", ["text", "embed", "reaction"]).default("text").notNull(),
  embedTitle: varchar("embedTitle", { length: 256 }), // Embed title (if responseType is embed)
  embedColor: varchar("embedColor", { length: 7 }), // Hex color for embed (e.g., "#FF5733")
  cooldownSeconds: int("cooldownSeconds").default(0).notNull(), // Cooldown in seconds
  cooldownType: mysqlEnum("cooldownType", ["user", "channel", "global"]).default("user").notNull(),
  permissionLevel: mysqlEnum("permissionLevel", ["everyone", "role", "admin"]).default("everyone").notNull(),
  requiredRoleIds: text("requiredRoleIds"), // JSON array of required role IDs
  enabled: boolean("enabled").default(true).notNull(),
  useCount: int("useCount").default(0).notNull(), // Track how many times command has been used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"), // Reference to users.id
});

export type CustomCommand = typeof customCommands.$inferSelect;
export type InsertCustomCommand = typeof customCommands.$inferInsert;

/**
 * Command Cooldowns table - tracks active cooldowns
 */
export const commandCooldowns = mysqlTable("command_cooldowns", {
  id: int("id").autoincrement().primaryKey(),
  commandId: int("commandId").notNull(), // Reference to customCommands.id
  userId: varchar("userId", { length: 64 }), // Discord user ID (null for global cooldowns)
  channelId: varchar("channelId", { length: 64 }), // Discord channel ID (null for user/global cooldowns)
  expiresAt: timestamp("expiresAt").notNull(), // When cooldown expires
});

export type CommandCooldown = typeof commandCooldowns.$inferSelect;
export type InsertCommandCooldown = typeof commandCooldowns.$inferInsert;

/**
 * Welcome Configuration table - server welcome settings
 */
export const welcomeConfig = mysqlTable("welcome_config", {
  id: int("id").autoincrement().primaryKey(),
  enabled: boolean("enabled").default(true).notNull(),
  channelId: varchar("channelId", { length: 64 }).notNull(), // Channel to send welcome messages
  messageType: mysqlEnum("messageType", ["text", "embed", "card"]).default("embed").notNull(),
  messageContent: text("messageContent").notNull(), // Message content with variables
  embedTitle: varchar("embedTitle", { length: 256 }), // Embed title
  embedColor: varchar("embedColor", { length: 7 }).default("#5865F2"), // Discord blurple
  embedImageUrl: text("embedImageUrl"), // Optional image URL
  dmEnabled: boolean("dmEnabled").default(false).notNull(), // Send DM to new member
  dmContent: text("dmContent"), // DM message content
  autoRoleIds: text("autoRoleIds"), // JSON array of role IDs to assign on join
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"), // Reference to users.id
});

export type WelcomeConfig = typeof welcomeConfig.$inferSelect;
export type InsertWelcomeConfig = typeof welcomeConfig.$inferInsert;

/**
 * Goodbye Configuration table - server goodbye settings
 */
export const goodbyeConfig = mysqlTable("goodbye_config", {
  id: int("id").autoincrement().primaryKey(),
  enabled: boolean("enabled").default(false).notNull(),
  channelId: varchar("channelId", { length: 64 }).notNull(), // Channel to send goodbye messages
  messageType: mysqlEnum("messageType", ["text", "embed"]).default("text").notNull(),
  messageContent: text("messageContent").notNull(), // Message content with variables
  embedTitle: varchar("embedTitle", { length: 256 }), // Embed title
  embedColor: varchar("embedColor", { length: 7 }).default("#ED4245"), // Discord red
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"), // Reference to users.id
});

export type GoodbyeConfig = typeof goodbyeConfig.$inferSelect;
export type InsertGoodbyeConfig = typeof goodbyeConfig.$inferInsert;

/**
 * Reaction Role Panels table - message panels with reaction roles
 */
export const reactionRolePanels = mysqlTable("reaction_role_panels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Panel name for admin reference
  channelId: varchar("channelId", { length: 64 }).notNull(), // Channel where panel is posted
  messageId: varchar("messageId", { length: 64 }), // Discord message ID (null until posted)
  title: varchar("title", { length: 256 }).notNull(), // Panel title
  description: text("description"), // Panel description
  embedColor: varchar("embedColor", { length: 7 }).default("#5865F2"),
  maxRoles: int("maxRoles").default(0).notNull(), // Max roles per user (0 = unlimited)
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"), // Reference to users.id
});

export type ReactionRolePanel = typeof reactionRolePanels.$inferSelect;
export type InsertReactionRolePanel = typeof reactionRolePanels.$inferInsert;

/**
 * Reaction Roles table - individual emoji-to-role mappings
 */
export const reactionRoles = mysqlTable("reaction_roles", {
  id: int("id").autoincrement().primaryKey(),
  panelId: int("panelId").notNull(), // Reference to reactionRolePanels.id
  emoji: varchar("emoji", { length: 100 }).notNull(), // Emoji (unicode or custom emoji ID)
  roleId: varchar("roleId", { length: 64 }).notNull(), // Discord role ID
  roleName: varchar("roleName", { length: 100 }).notNull(), // Role name for display
  description: varchar("description", { length: 256 }), // Optional role description
  requiredRoleIds: text("requiredRoleIds"), // JSON array of required role IDs to get this role
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReactionRole = typeof reactionRoles.$inferSelect;
export type InsertReactionRole = typeof reactionRoles.$inferInsert;

/**
 * User Activity table - tracks message and voice activity
 */
export const userActivity = mysqlTable("user_activity", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(), // Discord user ID
  username: varchar("username", { length: 255 }).notNull(), // Discord username (denormalized)
  messageCount: int("messageCount").default(0).notNull(), // Total messages sent
  voiceMinutes: int("voiceMinutes").default(0).notNull(), // Total voice time in minutes
  lastActive: timestamp("lastActive").defaultNow().notNull(), // Last activity timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;

/**
 * Message Stats table - detailed message statistics per user/channel
 */
export const messageStats = mysqlTable("message_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(), // Discord user ID
  channelId: varchar("channelId", { length: 64 }).notNull(), // Discord channel ID
  channelName: varchar("channelName", { length: 100 }), // Channel name (denormalized)
  messageCount: int("messageCount").default(1).notNull(), // Messages in this channel
  date: varchar("date", { length: 10 }).notNull(), // Date in YYYY-MM-DD format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessageStats = typeof messageStats.$inferSelect;
export type InsertMessageStats = typeof messageStats.$inferInsert;

/**
 * Voice Stats table - voice channel activity tracking
 */
export const voiceStats = mysqlTable("voice_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(), // Discord user ID
  channelId: varchar("channelId", { length: 64 }).notNull(), // Voice channel ID
  channelName: varchar("channelName", { length: 100 }), // Channel name (denormalized)
  joinedAt: timestamp("joinedAt").notNull(), // When user joined voice
  leftAt: timestamp("leftAt"), // When user left voice (null if still in)
  durationMinutes: int("durationMinutes"), // Duration in minutes (calculated on leave)
  date: varchar("date", { length: 10 }).notNull(), // Date in YYYY-MM-DD format
});

export type VoiceStats = typeof voiceStats.$inferSelect;
export type InsertVoiceStats = typeof voiceStats.$inferInsert;

/**
 * Server Logs table - comprehensive event logging
 */
export const serverLogs = mysqlTable("server_logs", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", [
    "message_edit", "message_delete",
    "member_join", "member_leave",
    "role_add", "role_remove",
    "kick", "ban", "timeout",
    "channel_create", "channel_delete", "channel_update",
    "nickname_change", "username_change"
  ]).notNull(),
  userId: varchar("userId", { length: 64 }), // Discord user ID (null for channel events)
  username: varchar("username", { length: 255 }), // Username at time of event
  channelId: varchar("channelId", { length: 64 }), // Relevant channel ID
  channelName: varchar("channelName", { length: 100 }), // Channel name
  moderatorId: varchar("moderatorId", { length: 64 }), // Moderator who performed action
  moderatorName: varchar("moderatorName", { length: 255 }), // Moderator name
  oldValue: text("oldValue"), // Previous value (e.g., old message content, old nickname)
  newValue: text("newValue"), // New value (e.g., edited message, new nickname)
  reason: text("reason"), // Reason for mod action
  metadata: text("metadata"), // JSON object for additional data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ServerLog = typeof serverLogs.$inferSelect;
export type InsertServerLog = typeof serverLogs.$inferInsert;

/**
 * Badge Requirements table - defines attribute requirements for badge tiers
 */
export const badgeRequirements = mysqlTable("badge_requirements", {
  id: int("id").autoincrement().primaryKey(),
  badgeName: varchar("badgeName", { length: 100 }).notNull(), // Badge abbreviation (e.g., "SS", "LIM", "ANK")
  tier: mysqlEnum("tier", ["bronze", "silver", "gold"]).notNull(),
  attribute1: varchar("attribute1", { length: 50 }), // First attribute name (e.g., "3pt", "pd")
  threshold1: int("threshold1"), // Minimum value for attribute1
  attribute2: varchar("attribute2", { length: 50 }), // Second attribute (optional)
  threshold2: int("threshold2"), // Minimum value for attribute2
  attribute3: varchar("attribute3", { length: 50 }), // Third attribute (optional)
  threshold3: int("threshold3"), // Minimum value for attribute3
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BadgeRequirement = typeof badgeRequirements.$inferSelect;
export type InsertBadgeRequirement = typeof badgeRequirements.$inferInsert;

/**
 * Badge Abbreviations table - maps full badge names to abbreviations
 */
export const badgeAbbreviations = mysqlTable("badge_abbreviations", {
  id: int("id").autoincrement().primaryKey(),
  abbreviation: varchar("abbreviation", { length: 10 }).notNull().unique(), // Short form (e.g., "SS", "LIM")
  fullName: varchar("fullName", { length: 100 }).notNull(), // Full badge name (e.g., "Set Shot", "Limitless Range")
  category: text("category"), // Badge category or description
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BadgeAbbreviation = typeof badgeAbbreviations.$inferSelect;
export type InsertBadgeAbbreviation = typeof badgeAbbreviations.$inferInsert;

/**
 * Upgrade Requests table - stores all upgrade requests from team channels
 */
export const upgradeRequests = mysqlTable("upgrade_requests", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }), // Reference to players.id (null if player not found)
  playerName: varchar("playerName", { length: 255 }).notNull(), // Player name from message
  badgeName: varchar("badgeName", { length: 100 }).notNull(), // Badge abbreviation
  fromLevel: mysqlEnum("fromLevel", ["none", "bronze", "silver", "gold"]).notNull(), // Current level
  toLevel: mysqlEnum("toLevel", ["bronze", "silver", "gold"]).notNull(), // Requested level
  attributes: text("attributes"), // JSON string of attributes (e.g., {"3pt": 83, "pd": 88})
  gameNumber: int("gameNumber"), // Game number when upgrade was earned (e.g., 5)
  upgradeType: varchar("upgradeType", { length: 50 }), // Upgrade type: Global, Welcome, 5-Game Badge, 7-Game Attribute, Rookie, OG, Superstar Pack, Activity Bonus
  requestedBy: varchar("requestedBy", { length: 64 }).notNull(), // Discord user ID
  requestedByName: varchar("requestedByName", { length: 255 }), // Discord username
  team: varchar("team", { length: 100 }).notNull(), // Team name
  channelId: varchar("channelId", { length: 64 }).notNull(), // Discord channel ID
  messageId: varchar("messageId", { length: 64 }).notNull(), // Discord message ID
  status: mysqlEnum("status", ["pending", "approved", "rejected", "forwarded"]).default("pending").notNull(),
  approvedBy: varchar("approvedBy", { length: 64 }), // Admin who approved/rejected
  approvedAt: timestamp("approvedAt"), // When it was approved/rejected
  validationErrors: text("validationErrors"), // JSON array of validation errors
  ruleViolations: text("ruleViolations"), // JSON array of rule violations (warnings)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UpgradeRequest = typeof upgradeRequests.$inferSelect;
export type InsertUpgradeRequest = typeof upgradeRequests.$inferInsert;

/**
 * Player Upgrades table - completed/approved upgrades
 */
export const playerUpgrades = mysqlTable("player_upgrades", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }).notNull(), // Reference to players.id
  playerName: varchar("playerName", { length: 255 }).notNull(), // Player name
  badgeName: varchar("badgeName", { length: 100 }), // Badge upgraded (null for attribute upgrades)
  fromLevel: mysqlEnum("fromLevel", ["none", "bronze", "silver", "gold"]),
  toLevel: mysqlEnum("toLevel", ["bronze", "silver", "gold"]),
  upgradeType: mysqlEnum("upgradeType", ["badge_level", "new_badge", "attribute"]).notNull(),
  statName: varchar("statName", { length: 50 }), // Attribute name for stat upgrades (3pt, mid, etc.)
  statIncrease: int("statIncrease"), // Amount increased (+3, +5, etc.)
  newStatValue: int("newStatValue"), // New attribute value after upgrade
  gameNumber: int("gameNumber"), // Game number when upgrade was applied (e.g., "5gm")
  requestId: int("requestId"), // Reference to upgradeRequests.id
  metadata: text("metadata"), // JSON metadata (upgradeType: Welcome/5GM/7GM/Rookie/OG/Superstar/Activity, category, userId, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(), // When upgrade was recorded
  completedAt: timestamp("completedAt").defaultNow().notNull(), // When upgrade was completed/approved
});

export type PlayerUpgrade = typeof playerUpgrades.$inferSelect;
export type InsertPlayerUpgrade = typeof playerUpgrades.$inferInsert;

/**
 * Badge Additions table - tracks which badges were added to rookie players
 * Used to enforce the rule: "Only 2 added badges can be upgraded to silver"
 */
export const badgeAdditions = mysqlTable("badge_additions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }).notNull(), // Reference to players.id
  playerName: varchar("playerName", { length: 255 }).notNull(), // Player name
  badgeName: varchar("badgeName", { length: 100 }).notNull(), // Badge abbreviation that was added
  addedAt: timestamp("addedAt").defaultNow().notNull(), // When badge was added
  upgradeId: int("upgradeId"), // Reference to playerUpgrades.id that added this badge
  usedForSilver: int("usedForSilver").default(0).notNull(), // 1 if badge was used for silver upgrade, 0 otherwise
  metadata: text("metadata"), // JSON metadata (source, admin, etc.)
});

export type BadgeAddition = typeof badgeAdditions.$inferSelect;
export type InsertBadgeAddition = typeof badgeAdditions.$inferInsert;

/**
 * Upgrade Audit Trail table - tracks all rollbacks and corrections to player upgrades
 */
export const upgradeAuditTrail = mysqlTable("upgrade_audit_trail", {
  id: int("id").autoincrement().primaryKey(),
  upgradeId: int("upgradeId").notNull(), // Reference to playerUpgrades.id
  actionType: mysqlEnum("actionType", ["rollback", "correction"]).notNull(),
  performedBy: int("performedBy").notNull(), // Reference to users.id who performed the action
  performedByName: varchar("performedByName", { length: 255 }).notNull(),
  reason: text("reason"), // Reason for rollback or correction
  
  // Original values before correction (null for rollback)
  originalBadgeName: varchar("originalBadgeName", { length: 100 }),
  originalFromLevel: mysqlEnum("originalFromLevel", ["none", "bronze", "silver", "gold"]),
  originalToLevel: mysqlEnum("originalToLevel", ["bronze", "silver", "gold"]),
  originalStatName: varchar("originalStatName", { length: 50 }),
  originalStatIncrease: int("originalStatIncrease"),
  originalNewStatValue: int("originalNewStatValue"),
  originalMetadata: text("originalMetadata"), // JSON snapshot of original metadata
  
  // New values after correction (null for rollback)
  correctedBadgeName: varchar("correctedBadgeName", { length: 100 }),
  correctedFromLevel: mysqlEnum("correctedFromLevel", ["none", "bronze", "silver", "gold"]),
  correctedToLevel: mysqlEnum("correctedToLevel", ["bronze", "silver", "gold"]),
  correctedStatName: varchar("correctedStatName", { length: 50 }),
  correctedStatIncrease: int("correctedStatIncrease"),
  correctedNewStatValue: int("correctedNewStatValue"),
  correctedMetadata: text("correctedMetadata"), // JSON snapshot of corrected metadata
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UpgradeAuditTrail = typeof upgradeAuditTrail.$inferSelect;
export type InsertUpgradeAuditTrail = typeof upgradeAuditTrail.$inferInsert;

/**
 * Validation Rules table - configurable upgrade validation rules
 */
export const validationRules = mysqlTable("validation_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Rule identifier (auto-generated)
  description: text("description").notNull(), // Human-readable rule text
  ruleType: varchar("ruleType", { length: 100 }).notNull(), // Upgrade type: Global, Welcome, 5-Game Badge, 7-Game Attribute, Rookie, OG, Superstar Pack, Activity Bonus
  category: varchar("category", { length: 100 }).notNull(), // Category: Eligibility, Reward, Rules, Limits, etc.
  enabled: int("enabled").default(1).notNull(), // 1 = enabled, 0 = disabled
  config: text("config").notNull(), // JSON configuration for the rule
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ValidationRule = typeof validationRules.$inferSelect;
export type InsertValidationRule = typeof validationRules.$inferInsert;

/**
 * Trade Votes table - tracks processed trade votes to prevent duplicate approval messages
 */
export const tradeVotes = mysqlTable("trade_votes", {
  id: int("id").autoincrement().primaryKey(),
  messageId: varchar("messageId", { length: 64 }).notNull().unique(), // Discord message ID
  upvotes: int("upvotes").notNull().default(0), // Final upvote count
  downvotes: int("downvotes").notNull().default(0), // Final downvote count
  approved: int("approved").notNull(), // 1 = approved, 0 = rejected
  processedAt: timestamp("processedAt").defaultNow().notNull(), // When vote was processed
});

export type TradeVote = typeof tradeVotes.$inferSelect;
export type InsertTradeVote = typeof tradeVotes.$inferInsert;

/**
 * Trades table - comprehensive trade tracking with all details
 */
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  messageId: varchar("messageId", { length: 64 }).notNull().unique(), // Discord message ID
  team1: varchar("team1", { length: 64 }).notNull(), // First team name
  team2: varchar("team2", { length: 64 }).notNull(), // Second team name
  team1Players: text("team1Players").notNull(), // JSON array of player objects
  team2Players: text("team2Players").notNull(), // JSON array of player objects
  status: mysqlEnum("status", ["pending", "approved", "rejected", "reversed"]).notNull().default("pending"),
  upvotes: int("upvotes").notNull().default(0),
  downvotes: int("downvotes").notNull().default(0),
  approvedBy: varchar("approvedBy", { length: 255 }), // Admin who approved
  rejectedBy: varchar("rejectedBy", { length: 255 }), // Admin who rejected
  reversedBy: varchar("reversedBy", { length: 255 }), // Admin who reversed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"), // When approved/rejected
  reversedAt: timestamp("reversedAt"), // When reversed
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

/**
 * Activity Booster Records Table
 * Stores W/L records for each team from activity booster posts
 */
export const activityRecords = mysqlTable("activity_records", {
  id: int("id").autoincrement().primaryKey(),
  teamName: varchar("teamName", { length: 100 }).notNull().unique(),
  wins: int("wins").notNull().default(0),
  losses: int("losses").notNull().default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
});

export type ActivityRecord = typeof activityRecords.$inferSelect;
export type InsertActivityRecord = typeof activityRecords.$inferInsert;

/**
 * Activity Booster Checkpoint Table
 * Tracks the last processed message and standings post
 */
export const activityCheckpoint = mysqlTable("activity_checkpoint", {
  id: int("id").autoincrement().primaryKey(),
  lastProcessedMessageId: varchar("lastProcessedMessageId", { length: 64 }).notNull(),
  lastStandingsMessageId: varchar("lastStandingsMessageId", { length: 64 }),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
  totalGamesProcessed: int("totalGamesProcessed").notNull().default(0),
});

export type ActivityCheckpoint = typeof activityCheckpoint.$inferSelect;
export type InsertActivityCheckpoint = typeof activityCheckpoint.$inferInsert;

/**
 * Activity Booster Head-to-Head Table
 * Tracks matchup records between teams
 */
export const activityHeadToHead = mysqlTable("activity_head_to_head", {
  id: int("id").autoincrement().primaryKey(),
  team1: varchar("team1", { length: 100 }).notNull(),
  team2: varchar("team2", { length: 100 }).notNull(),
  team1Wins: int("team1Wins").notNull().default(0),
  team2Wins: int("team2Wins").notNull().default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
});

export type ActivityHeadToHead = typeof activityHeadToHead.$inferSelect;
export type InsertActivityHeadToHead = typeof activityHeadToHead.$inferInsert;

/**
 * Activity Processed Messages Table
 * Tracks individual messages that have been processed to prevent duplicates
 * This ensures idempotent processing even with concurrent command executions
 */
export const activityProcessedMessages = mysqlTable("activity_processed_messages", {
  id: int("id").autoincrement().primaryKey(),
  messageId: varchar("messageId", { length: 64 }).notNull().unique(),
  authorId: varchar("authorId", { length: 64 }).notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  postingTeam: varchar("postingTeam", { length: 100 }).notNull(),
  opponentTeam: varchar("opponentTeam", { length: 100 }).notNull(),
  postingTeamResult: varchar("postingTeamResult", { length: 1 }).notNull(), // W or L
  opponentTeamResult: varchar("opponentTeamResult", { length: 1 }).notNull(), // W or L
  processedAt: timestamp("processedAt").defaultNow().notNull(),
});

export type ActivityProcessedMessage = typeof activityProcessedMessages.$inferSelect;
export type InsertActivityProcessedMessage = typeof activityProcessedMessages.$inferInsert;

/**
 * Bot Logs Table
 * Stores Discord bot activity logs including commands, errors, and events
 */
export const botLogs = mysqlTable("bot_logs", {
  id: int("id").autoincrement().primaryKey(),
  level: mysqlEnum("level", ["info", "warn", "error", "debug"]).notNull().default("info"),
  eventType: varchar("eventType", { length: 100 }).notNull(), // command, error, discord_event, etc.
  message: text("message").notNull(),
  details: text("details"), // JSON string with additional context
  userId: varchar("userId", { length: 64 }), // Discord user ID if applicable
  username: varchar("username", { length: 255 }), // Discord username if applicable
  channelId: varchar("channelId", { length: 64 }), // Discord channel ID if applicable
  guildId: varchar("guildId", { length: 64 }), // Discord guild ID if applicable
  commandName: varchar("commandName", { length: 100 }), // Command name if applicable
  errorStack: text("errorStack"), // Error stack trace if applicable
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BotLog = typeof botLogs.$inferSelect;
export type InsertBotLog = typeof botLogs.$inferInsert;

/**
 * Scheduled Restarts Table
 * Stores bot restart schedule configuration
 */
export const scheduledRestarts = mysqlTable("scheduled_restarts", {
  id: int("id").autoincrement().primaryKey(),
  enabled: int("enabled").notNull().default(0), // 0 = disabled, 1 = enabled
  cronExpression: varchar("cronExpression", { length: 100 }).notNull(), // Cron expression for schedule
  timezone: varchar("timezone", { length: 100 }).notNull().default("America/New_York"),
  lastExecuted: timestamp("lastExecuted"),
  nextExecution: timestamp("nextExecution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledRestart = typeof scheduledRestarts.$inferSelect;
export type InsertScheduledRestart = typeof scheduledRestarts.$inferInsert;

/**
 * Restart History Table
 * Tracks all bot restart events
 */
export const restartHistory = mysqlTable("restart_history", {
  id: int("id").autoincrement().primaryKey(),
  restartType: mysqlEnum("restartType", ["manual", "scheduled", "automatic"]).notNull(),
  triggeredBy: varchar("triggeredBy", { length: 255 }), // User or system identifier
  success: int("success").notNull(), // 0 = failed, 1 = success
  errorMessage: text("errorMessage"), // Error details if failed
  uptime: int("uptime"), // Bot uptime in seconds before restart
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RestartHistory = typeof restartHistory.$inferSelect;
export type InsertRestartHistory = typeof restartHistory.$inferInsert;

/**
 * Health Alerts Configuration Table
 * Stores bot health monitoring and alert settings
 */
export const healthAlerts = mysqlTable("health_alerts", {
  id: int("id").autoincrement().primaryKey(),
  enabled: int("enabled").notNull().default(1), // 0 = disabled, 1 = enabled
  alertChannelId: varchar("alertChannelId", { length: 64 }).notNull(), // Discord channel for alerts
  offlineAlertEnabled: int("offlineAlertEnabled").notNull().default(1),
  errorAlertEnabled: int("errorAlertEnabled").notNull().default(1),
  errorThreshold: int("errorThreshold").notNull().default(5), // Number of errors before alert
  checkIntervalSeconds: int("checkIntervalSeconds").notNull().default(60), // Health check interval
  lastHealthCheck: timestamp("lastHealthCheck"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HealthAlert = typeof healthAlerts.$inferSelect;
export type InsertHealthAlert = typeof healthAlerts.$inferInsert;

/**
 * Alert History Table
 * Tracks all health alerts sent
 */
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  alertType: mysqlEnum("alertType", ["offline", "error", "recovery"]).notNull(),
  message: text("message").notNull(),
  details: text("details"), // JSON string with additional context
  discordMessageId: varchar("discordMessageId", { length: 64 }), // Discord message ID of alert
  resolved: int("resolved").notNull().default(0), // 0 = active, 1 = resolved
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistoryRecord = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

/**
 * Trade Log table - stores all trades submitted via Trade Machine for admin review
 */
export const tradeLogs = mysqlTable("trade_logs", {
  id: int("id").autoincrement().primaryKey(),
  team1: varchar("team1", { length: 100 }).notNull(), // First team in trade
  team2: varchar("team2", { length: 100 }).notNull(), // Second team in trade
  team1Players: text("team1Players").notNull(), // JSON array of player objects from team1
  team2Players: text("team2Players").notNull(), // JSON array of player objects from team2
  playerBadges: text("playerBadges").notNull(), // JSON object mapping player IDs to badge counts
  status: mysqlEnum("status", ["pending", "approved", "declined"]).default("pending").notNull(),
  submittedBy: varchar("submittedBy", { length: 255 }), // Discord username or user info
  reviewedBy: int("reviewedBy"), // Reference to users.id who reviewed
  reviewedAt: timestamp("reviewedAt"), // When trade was approved/declined
  notes: text("notes"), // Admin notes about the trade
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TradeLog = typeof tradeLogs.$inferSelect;
export type InsertTradeLog = typeof tradeLogs.$inferInsert;

/**
 * Upgrade History table - detailed tracking of each individual upgrade
 * Provides audit trail showing attribute name, date, and user for each upgrade
 */
export const upgradeHistory = mysqlTable("upgrade_history", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }).notNull(), // Reference to players.id
  playerName: varchar("playerName", { length: 255 }).notNull(), // Denormalized for history
  attributeName: varchar("attributeName", { length: 255 }).notNull(), // Specific attribute upgraded (e.g., "3PT", "Finishing", "Welcome")
  upgradeType: varchar("upgradeType", { length: 50 }).notNull(), // Type of upgrade (e.g., "Welcome", "Game", "Badge", "Attribute")
  userId: varchar("userId", { length: 64 }).notNull(), // Discord user ID who performed upgrade
  userName: varchar("userName", { length: 255 }).notNull(), // Discord username (denormalized)
  team: varchar("team", { length: 100 }).notNull(), // Team at time of upgrade
  previousValue: varchar("previousValue", { length: 50 }), // Value before upgrade (if applicable)
  newValue: varchar("newValue", { length: 50 }), // Value after upgrade (if applicable)
  createdAt: timestamp("createdAt").defaultNow().notNull(), // When upgrade was performed
});

export type UpgradeHistory = typeof upgradeHistory.$inferSelect;
export type InsertUpgradeHistory = typeof upgradeHistory.$inferInsert;

/**
 * Team Aliases table - stores custom team name aliases for trade parsing
 * Allows admins to manage global team name mappings (e.g., "Cavs" -> "Cavaliers")
 */
export const teamAliases = mysqlTable("team_aliases", {
  id: int("id").autoincrement().primaryKey(),
  alias: varchar("alias", { length: 100 }).notNull().unique(), // The alias (e.g., "Cavs")
  canonicalName: varchar("canonicalName", { length: 100 }).notNull(), // The official team name (e.g., "Cavaliers")
  createdBy: int("createdBy"), // Reference to users.id who created this alias
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamAlias = typeof teamAliases.$inferSelect;
export type InsertTeamAlias = typeof teamAliases.$inferInsert;

// Export upgrade compliance tables
export * from "./upgradeRules";
