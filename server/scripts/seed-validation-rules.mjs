import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { mysqlTable, int, varchar, boolean, text, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import 'dotenv/config';

// Define schema inline for the script
const validationRules = mysqlTable("validation_rules", {
  id: int("id").autoincrement().primaryKey(),
  ruleName: varchar("ruleName", { length: 100 }).notNull().unique(),
  ruleType: mysqlEnum("ruleType", ["game_requirement", "attribute_check", "badge_limit", "cooldown"]).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  config: text("config").notNull(),
  errorMessage: text("errorMessage"),
  severity: mysqlEnum("severity", ["error", "warning"]).default("error").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
});

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
});

const db = drizzle(connection);

// Initial validation rules to seed
const initialRules = [
  {
    ruleName: "require_match_proof",
    ruleType: "game_requirement",
    enabled: true,
    config: JSON.stringify({ requireScreenshot: true }),
    errorMessage: "Screenshot proof is required for badge upgrade requests",
    severity: "error",
  },
  {
    ruleName: "max_upgrades_per_window",
    ruleType: "badge_limit",
    enabled: true,
    config: JSON.stringify({ maxUpgrades: 6, windowType: "fa" }),
    errorMessage: "Maximum 6 badge upgrades allowed per FA window",
    severity: "error",
  },
  {
    ruleName: "auto_approve_bronze",
    ruleType: "badge_limit",
    enabled: false,
    config: JSON.stringify({ autoApprove: true, tier: "bronze" }),
    errorMessage: null,
    severity: "warning",
  },
  {
    ruleName: "min_attributes_required",
    ruleType: "attribute_check",
    enabled: true,
    config: JSON.stringify({ minAttributes: 3 }),
    errorMessage: "At least 3 attributes must be specified for upgrade request",
    severity: "error",
  },
  {
    ruleName: "allow_duplicate_badges",
    ruleType: "badge_limit",
    enabled: false,
    config: JSON.stringify({ allowDuplicates: false }),
    errorMessage: "Duplicate badges at different tiers are not allowed",
    severity: "warning",
  },
  {
    ruleName: "upgrade_cooldown_period",
    ruleType: "cooldown",
    enabled: true,
    config: JSON.stringify({ cooldownHours: 24, perPlayer: true }),
    errorMessage: "Must wait 24 hours between upgrade requests for the same player",
    severity: "error",
  },
];

console.log("Seeding validation rules...");

for (const rule of initialRules) {
  try {
    await db.insert(validationRules).values(rule);
    console.log(`✓ Seeded rule: ${rule.ruleName}`);
  } catch (error) {
    if (error.message.includes('Duplicate entry')) {
      console.log(`⊘ Rule already exists: ${rule.ruleName}`);
    } else {
      console.error(`✗ Failed to seed rule ${rule.ruleName}:`, error.message);
    }
  }
}

console.log("\nValidation rules seeding complete!");
await connection.end();
