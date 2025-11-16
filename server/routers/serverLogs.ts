/**
 * Server Logs Router
 * TRPC endpoints for querying server event logs
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db.js";
import { serverLogs } from '../../drizzle/schema.js';
import { desc, sql, eq, and, gte, like } from "drizzle-orm";

export const serverLogsRouter = router({
  /**
   * Get recent logs with filtering
   */
  getLogs: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
      eventType: z.enum([
        "all",
        "message_edit",
        "message_delete",
        "member_join",
        "member_leave",
        "role_add",
        "role_remove",
        "kick",
        "ban",
        "timeout",
        "channel_create",
        "channel_delete",
        "channel_update",
        "nickname_change",
        "username_change"
      ]).default("all"),
      userId: z.string().optional(),
      channelId: z.string().optional(),
      startDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Build where conditions
      const conditions = [];
      
      if (input.eventType !== "all") {
        conditions.push(eq(serverLogs.eventType, input.eventType));
      }
      
      if (input.userId) {
        conditions.push(eq(serverLogs.userId, input.userId));
      }
      
      if (input.channelId) {
        conditions.push(eq(serverLogs.channelId, input.channelId));
      }
      
      if (input.startDate) {
        conditions.push(gte(serverLogs.timestamp, new Date(input.startDate)));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const logs = await db.select()
        .from(serverLogs)
        .where(whereClause)
        .orderBy(desc(serverLogs.timestamp))
        .limit(input.limit)
        .offset(input.offset);
      
      // Get total count
      const countResult = await db.select({
        count: sql<number>`COUNT(*)`,
      }).from(serverLogs).where(whereClause);
      
      return {
        logs,
        total: countResult[0]?.count || 0,
      };
    }),

  /**
   * Get logs for specific user
   */
  getUserLogs: protectedProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const logs = await db.select()
        .from(serverLogs)
        .where(eq(serverLogs.userId, input.userId))
        .orderBy(desc(serverLogs.timestamp))
        .limit(input.limit);
      
      return logs;
    }),

  /**
   * Get logs by event type
   */
  getLogsByType: protectedProcedure
    .input(z.object({
      eventType: z.enum([
        "message_edit",
        "message_delete",
        "member_join",
        "member_leave",
        "role_add",
        "role_remove",
        "kick",
        "ban",
        "timeout",
        "channel_create",
        "channel_delete",
        "channel_update",
        "nickname_change",
        "username_change"
      ]),
      limit: z.number().min(1).max(100).default(50),
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      
      const logs = await db.select()
        .from(serverLogs)
        .where(and(
          eq(serverLogs.eventType, input.eventType),
          gte(serverLogs.timestamp, startDate)
        ))
        .orderBy(desc(serverLogs.timestamp))
        .limit(input.limit);
      
      return logs;
    }),

  /**
   * Search logs by username or content
   */
  searchLogs: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const logs = await db.select()
        .from(serverLogs)
        .where(
          sql`${serverLogs.username} LIKE ${`%${input.query}%`} OR ${serverLogs.oldValue} LIKE ${`%${input.query}%`} OR ${serverLogs.newValue} LIKE ${`%${input.query}%`}`
        )
        .orderBy(desc(serverLogs.timestamp))
        .limit(input.limit);
      
      return logs;
    }),

  /**
   * Get log statistics
   */
  getLogStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      
      // Get counts by event type
      const stats = await db.select({
        eventType: serverLogs.eventType,
        count: sql<number>`COUNT(*)`,
      })
        .from(serverLogs)
        .where(gte(serverLogs.timestamp, startDate))
        .groupBy(serverLogs.eventType);
      
      return stats;
    }),

  /**
   * Get single log by ID
   */
  getLogById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const log = await db.select()
        .from(serverLogs)
        .where(eq(serverLogs.id, input.id))
        .limit(1);
      
      return log[0] || null;
    }),
});
