import { int, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Stores the parsed upgrade rules from the CSV
 */
export const upgradeRules = mysqlTable("upgrade_rules", {
  id: int("id").autoincrement().primaryKey(),
  upgradeType: varchar("upgradeType", { length: 100 }).notNull(), // Global, Welcome, 5-Game Badge, 7-Game Attribute, Rookie, OG, Superstar Pack, Activity Bonus
  category: varchar("category", { length: 100 }).notNull(), // Attributes, Badges, Eligibility, Reward, Limits, Rules, etc.
  ruleText: text("ruleText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UpgradeRule = typeof upgradeRules.$inferSelect;
export type InsertUpgradeRule = typeof upgradeRules.$inferInsert;

/**
 * Stores compliance violations found during audits
 */
export const upgradeViolations = mysqlTable("upgrade_violations", {
  id: int("id").autoincrement().primaryKey(),
  upgradeLogId: int("upgradeLogId"), // Reference to upgrade_log if applicable
  playerId: varchar("playerId", { length: 64 }), // Reference to player
  playerName: varchar("playerName", { length: 255 }),
  upgradeType: varchar("upgradeType", { length: 100 }).notNull(),
  violationType: varchar("violationType", { length: 100 }).notNull(), // e.g., "ATTRIBUTE_CAP_EXCEEDED", "BADGE_RESTRICTED", etc.
  ruleViolated: text("ruleViolated").notNull(), // The specific rule text that was violated
  details: text("details").notNull(), // JSON string with violation details
  severity: varchar("severity", { length: 20 }).notNull(), // "ERROR", "WARNING", "INFO"
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: varchar("resolvedBy", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UpgradeViolation = typeof upgradeViolations.$inferSelect;
export type InsertUpgradeViolation = typeof upgradeViolations.$inferInsert;

/**
 * Stores audit history
 */
export const upgradeAudits = mysqlTable("upgrade_audits", {
  id: int("id").autoincrement().primaryKey(),
  auditType: varchar("auditType", { length: 100 }).notNull(), // "FULL_AUDIT", "PLAYER_AUDIT", "UPGRADE_VALIDATION"
  status: varchar("status", { length: 50 }).notNull(), // "RUNNING", "COMPLETED", "FAILED"
  totalChecked: int("totalChecked").notNull().default(0),
  violationsFound: int("violationsFound").notNull().default(0),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  results: text("results"), // JSON string with summary results
  createdBy: varchar("createdBy", { length: 255 }),
});

export type UpgradeAudit = typeof upgradeAudits.$inferSelect;
export type InsertUpgradeAudit = typeof upgradeAudits.$inferInsert;
