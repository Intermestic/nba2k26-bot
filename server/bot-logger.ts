import { getDb, assertDb } from "./db.js";
import { botLogs } from "../drizzle/schema.js";

export interface BotLogEntry {
  level: "info" | "warn" | "error" | "debug";
  eventType: string;
  message: string;
  details?: string;
  userId?: string;
  username?: string;
  channelId?: string;
  guildId?: string;
  commandName?: string;
  errorStack?: string;
}

/**
 * Log bot activity to database
 */
export async function logBotActivity(entry: BotLogEntry): Promise<void> {
  try {
    const db = await getDb();
  assertDb(db);
    await db.insert(botLogs).values({
      level: entry.level,
      eventType: entry.eventType,
      message: entry.message,
      details: entry.details,
      userId: entry.userId,
      username: entry.username,
      channelId: entry.channelId,
      guildId: entry.guildId,
      commandName: entry.commandName,
      errorStack: entry.errorStack,
    });
  } catch (error) {
    // Don't throw errors from logging - just console log
    console.error("[Bot Logger] Failed to log activity:", error);
  }
}

/**
 * Log command execution
 */
export async function logCommand(
  commandName: string,
  userId: string,
  username: string,
  channelId: string,
  guildId: string,
  message: string,
  details?: any
): Promise<void> {
  await logBotActivity({
    level: "info",
    eventType: "command",
    message,
    details: details ? JSON.stringify(details, null, 2) : undefined,
    userId,
    username,
    channelId,
    guildId,
    commandName,
  });
}

/**
 * Log error
 */
export async function logError(
  eventType: string,
  message: string,
  error: Error,
  context?: {
    userId?: string;
    username?: string;
    channelId?: string;
    guildId?: string;
    commandName?: string;
  }
): Promise<void> {
  await logBotActivity({
    level: "error",
    eventType,
    message,
    details: JSON.stringify({
      error: error.message,
      ...context,
    }, null, 2),
    errorStack: error.stack,
    ...context,
  });
}

/**
 * Log Discord event
 */
export async function logDiscordEvent(
  eventType: string,
  message: string,
  details?: any
): Promise<void> {
  await logBotActivity({
    level: "info",
    eventType: `discord_${eventType}`,
    message,
    details: details ? JSON.stringify(details, null, 2) : undefined,
  });
}

/**
 * Log warning
 */
export async function logWarning(
  eventType: string,
  message: string,
  details?: any,
  context?: {
    userId?: string;
    username?: string;
    channelId?: string;
    guildId?: string;
  }
): Promise<void> {
  await logBotActivity({
    level: "warn",
    eventType,
    message,
    details: details ? JSON.stringify(details, null, 2) : undefined,
    ...context,
  });
}
