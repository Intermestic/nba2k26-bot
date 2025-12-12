import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc.js";
import { getDb, assertDb } from "../db.js";
import { botLogs } from "../../drizzle/schema.js";
import { desc, eq, and, gte, lte, like, sql } from "drizzle-orm";

export const botLogsRouter = router({
  // Get bot logs with filters
  getLogs: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
        level: z.enum(["info", "warn", "error", "debug"]).optional(),
        eventType: z.string().optional(),
        search: z.string().optional(),
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  assertDb(db);
      const { page, pageSize, level, eventType, search, startDate, endDate } = input;
      const offset = (page - 1) * pageSize;

      // Build where conditions
      const conditions = [];
      
      if (level) {
        conditions.push(eq(botLogs.level, level));
      }
      
      if (eventType) {
        conditions.push(eq(botLogs.eventType, eventType));
      }
      
      if (search) {
        conditions.push(
          sql`(${botLogs.message} LIKE ${`%${search}%`} OR ${botLogs.username} LIKE ${`%${search}%`} OR ${botLogs.commandName} LIKE ${`%${search}%`})`
        );
      }
      
      if (startDate) {
        conditions.push(gte(botLogs.createdAt, new Date(startDate)));
      }
      
      if (endDate) {
        conditions.push(lte(botLogs.createdAt, new Date(endDate)));
      }

      // Get logs with pagination
      const logs = await db
        .select()
        .from(botLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(botLogs.createdAt))
        .limit(pageSize)
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(botLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        logs,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      };
    }),

  // Get event types for filter dropdown
  getEventTypes: publicProcedure.query(async () => {
    const db = await getDb();
  assertDb(db);
    
    const types = await db
      .select({ eventType: botLogs.eventType })
      .from(botLogs)
      .groupBy(botLogs.eventType)
      .orderBy(botLogs.eventType);

    return types.map((t) => t.eventType);
  }),

  // Get log statistics
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
  assertDb(db);
    
    // Get counts by level for last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = await db
      .select({
        level: botLogs.level,
        count: sql<number>`count(*)`,
      })
      .from(botLogs)
      .where(gte(botLogs.createdAt, oneDayAgo))
      .groupBy(botLogs.level);

    // Get recent error count
    const [{ errorCount }] = await db
      .select({ errorCount: sql<number>`count(*)` })
      .from(botLogs)
      .where(
        and(
          eq(botLogs.level, "error"),
          gte(botLogs.createdAt, oneDayAgo)
        )
      );

    // Get total logs count
    const [{ totalCount }] = await db
      .select({ totalCount: sql<number>`count(*)` })
      .from(botLogs);

    return {
      byLevel: stats.reduce((acc, { level, count }) => {
        acc[level] = count;
        return acc;
      }, {} as Record<string, number>),
      errorCount24h: errorCount,
      totalLogs: totalCount,
    };
  }),

  // Delete old logs
  deleteOldLogs: publicProcedure
    .input(
      z.object({
        daysToKeep: z.number().min(1).max(365),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
  assertDb(db);
      const cutoffDate = new Date(Date.now() - input.daysToKeep * 24 * 60 * 60 * 1000);

      const result = await db
        .delete(botLogs)
        .where(lte(botLogs.createdAt, cutoffDate));

      return {
        success: true,
        message: `Deleted logs older than ${input.daysToKeep} days`,
      };
    }),
});
