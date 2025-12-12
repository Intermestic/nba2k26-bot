import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Activity Booster Records Table
 * Stores W/L records for each team
 */
export const activityRecords = sqliteTable('activity_records', {
  id: int('id').primaryKey({ autoIncrement: true }),
  teamName: text('team_name').notNull().unique(),
  wins: int('wins').notNull().default(0),
  losses: int('losses').notNull().default(0),
  lastUpdated: int('last_updated', { mode: 'timestamp' }).notNull(),
});

/**
 * Activity Booster Checkpoint Table
 * Tracks the last processed message and standings post
 */
export const activityCheckpoint = sqliteTable('activity_checkpoint', {
  id: int('id').primaryKey({ autoIncrement: true }),
  lastProcessedMessageId: text('last_processed_message_id').notNull(),
  lastStandingsMessageId: text('last_standings_message_id'),
  processedAt: int('processed_at', { mode: 'timestamp' }).notNull(),
  totalGamesProcessed: int('total_games_processed').notNull().default(0),
});

export type ActivityRecord = typeof activityRecords.$inferSelect;
export type NewActivityRecord = typeof activityRecords.$inferInsert;

export type ActivityCheckpoint = typeof activityCheckpoint.$inferSelect;
export type NewActivityCheckpoint = typeof activityCheckpoint.$inferInsert;
