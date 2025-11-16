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
 * Badge Requirements table - stores attribute gates for each badge level
 */
export const badgeRequirements = mysqlTable("badge_requirements", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 50 }).notNull(), // Finishing, Shooting, Playmaking, Defense
  badgeName: varchar("badgeName", { length: 100 }).notNull(), // Full badge name
  attribute: varchar("attribute", { length: 100 }).notNull(), // Required attribute (e.g., "Mid-Range Shot")
  bronzeMin: int("bronzeMin"), // Minimum attribute value for Bronze
  silverMin: int("silverMin"), // Minimum attribute value for Silver
  goldMin: int("goldMin"), // Minimum attribute value for Gold
  minHeight: varchar("minHeight", { length: 10 }), // Minimum height (e.g., "5'9")
  maxHeight: varchar("maxHeight", { length: 10 }), // Maximum height (e.g., "7'4")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BadgeRequirement = typeof badgeRequirements.$inferSelect;
export type InsertBadgeRequirement = typeof badgeRequirements.$inferInsert;

/**
 * Badge Abbreviations table - maps abbreviations to full badge names
 */
export const badgeAbbreviations = mysqlTable("badge_abbreviations", {
  id: int("id").autoincrement().primaryKey(),
  badgeName: varchar("badgeName", { length: 100 }).notNull().unique(), // Full badge name
  abbreviation: varchar("abbreviation", { length: 10 }).notNull().unique(), // Short code (e.g., "SS")
  description: text("description"), // Badge description
  category: varchar("category", { length: 50 }), // Finishing, Shooting, Playmaking, Defense
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BadgeAbbreviation = typeof badgeAbbreviations.$inferSelect;
export type InsertBadgeAbbreviation = typeof badgeAbbreviations.$inferInsert;

/**
 * Upgrade Requests table - tracks all upgrade requests from team channels
 */
export const upgradeRequests = mysqlTable("upgrade_requests", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }), // Reference to players.id
  playerName: varchar("playerName", { length: 255 }).notNull(), // Player name from request
  badgeName: varchar("badgeName", { length: 100 }).notNull(), // Badge being upgraded
  fromLevel: mysqlEnum("fromLevel", ["none", "bronze", "silver", "gold"]).notNull(), // Current level
  toLevel: mysqlEnum("toLevel", ["bronze", "silver", "gold"]).notNull(), // Target level
  attributes: text("attributes"), // JSON object of provided attribute values
  requestedBy: varchar("requestedBy", { length: 64 }).notNull(), // Discord user ID
  requestedByName: varchar("requestedByName", { length: 255 }), // Discord username
  team: varchar("team", { length: 100 }).notNull(), // Team making request
  channelId: varchar("channelId", { length: 64 }).notNull(), // Team channel ID
  messageId: varchar("messageId", { length: 64 }).notNull(), // Original message ID
  status: mysqlEnum("status", ["pending", "approved", "rejected", "forwarded"]).default("pending").notNull(),
  validationErrors: text("validationErrors"), // JSON array of validation errors
  ruleViolations: text("ruleViolations"), // JSON array of rule violations (back-to-back, +6, etc.)
  approvedBy: varchar("approvedBy", { length: 64 }), // Discord user ID of admin who approved
  approvedAt: timestamp("approvedAt"), // When request was approved
  forwardedAt: timestamp("forwardedAt"), // When request was forwarded to upgrade channel
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UpgradeRequest = typeof upgradeRequests.$inferSelect;
export type InsertUpgradeRequest = typeof upgradeRequests.$inferInsert;

/**
 * Player Upgrades table - tracks completed upgrades for rule enforcement
 */
export const playerUpgrades = mysqlTable("player_upgrades", {
  id: int("id").autoincrement().primaryKey(),
  playerId: varchar("playerId", { length: 64 }).notNull(), // Reference to players.id
  playerName: varchar("playerName", { length: 255 }).notNull(), // Player name
  badgeName: varchar("badgeName", { length: 100 }).notNull(), // Badge upgraded
  fromLevel: mysqlEnum("fromLevel", ["none", "bronze", "silver", "gold"]).notNull(),
  toLevel: mysqlEnum("toLevel", ["bronze", "silver", "gold"]).notNull(),
  upgradeType: mysqlEnum("upgradeType", ["badge_level", "new_badge", "attribute"]).notNull(),
  gameNumber: int("gameNumber"), // Game number when upgrade was applied (e.g., "5gm")
  requestId: int("requestId"), // Reference to upgradeRequests.id
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type PlayerUpgrade = typeof playerUpgrades.$inferSelect;
export type InsertPlayerUpgrade = typeof playerUpgrades.$inferInsert;
