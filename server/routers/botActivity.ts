import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc.js";
import { getDb, assertDb } from "../db.js";
import { botLogs } from "../../drizzle/schema.js";
import { desc, eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

export const botActivityRouter = router({
  // Get command usage statistics
  getCommandStats: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  assertDb(db);

      // Build date filters
      const filters = [];
      if (input.startDate) {
        filters.push(gte(botLogs.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        filters.push(lte(botLogs.createdAt, new Date(input.endDate)));
      }

      // Get command usage counts
      const commandStats = await db
        .select({
          command: botLogs.commandName,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(botLogs)
        .where(
          and(
            eq(botLogs.eventType, "command"),
            isNotNull(botLogs.commandName),
            ...(filters.length > 0 ? [and(...filters)] : [])
          )
        )
        .groupBy(botLogs.commandName)
        .orderBy(desc(sql`count(*)`));

      return commandStats;
    }),

  // Get error rate statistics
  getErrorStats: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        groupBy: z.enum(["hour", "day"]).default("day"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  assertDb(db);

      // Build date filters
      const filters = [];
      if (input.startDate) {
        filters.push(gte(botLogs.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        filters.push(lte(botLogs.createdAt, new Date(input.endDate)));
      }

      // Group by time period
      const timeFormat =
        input.groupBy === "hour"
          ? sql`DATE_FORMAT(${botLogs.createdAt}, '%Y-%m-%d %H:00')`
          : sql`DATE_FORMAT(${botLogs.createdAt}, '%Y-%m-%d')`;

      // Get error counts over time
      const errorStats = await db
        .select({
          period: timeFormat.as("period"),
          errorCount: sql<number>`sum(case when ${botLogs.level} = 'error' then 1 else 0 end)`.as(
            "errorCount"
          ),
          totalCount: sql<number>`count(*)`.as("totalCount"),
        })
        .from(botLogs)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .groupBy(sql`period`)
        .orderBy(sql`period`);

      return errorStats.map((stat) => ({
        ...stat,
        errorRate: stat.totalCount > 0 ? (stat.errorCount / stat.totalCount) * 100 : 0,
      }));
    }),

  // Get activity timeline
  getActivityTimeline: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        groupBy: z.enum(["hour", "day"]).default("hour"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  assertDb(db);

      // Build date filters
      const filters = [];
      if (input.startDate) {
        filters.push(gte(botLogs.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        filters.push(lte(botLogs.createdAt, new Date(input.endDate)));
      }

      // Group by time period
      const timeFormat =
        input.groupBy === "hour"
          ? sql`DATE_FORMAT(${botLogs.createdAt}, '%Y-%m-%d %H:00')`
          : sql`DATE_FORMAT(${botLogs.createdAt}, '%Y-%m-%d')`;

      // Get activity counts over time
      const timeline = await db
        .select({
          period: timeFormat.as("period"),
          commandCount: sql<number>`sum(case when ${botLogs.eventType} = 'command' then 1 else 0 end)`.as(
            "commandCount"
          ),
          errorCount: sql<number>`sum(case when ${botLogs.level} = 'error' then 1 else 0 end)`.as(
            "errorCount"
          ),
          totalCount: sql<number>`count(*)`.as("totalCount"),
        })
        .from(botLogs)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .groupBy(sql`period`)
        .orderBy(sql`period`);

      return timeline;
    }),

  // Get summary statistics
  getSummaryStats: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  assertDb(db);

      // Build date filters
      const filters = [];
      if (input.startDate) {
        filters.push(gte(botLogs.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        filters.push(lte(botLogs.createdAt, new Date(input.endDate)));
      }

      // Get summary statistics
      const summary = await db
        .select({
          totalEvents: sql<number>`count(*)`.as("totalEvents"),
          totalCommands: sql<number>`sum(case when ${botLogs.eventType} = 'command' then 1 else 0 end)`.as(
            "totalCommands"
          ),
          totalErrors: sql<number>`sum(case when ${botLogs.level} = 'error' then 1 else 0 end)`.as(
            "totalErrors"
          ),
          uniqueUsers: sql<number>`count(distinct ${botLogs.userId})`.as("uniqueUsers"),
        })
        .from(botLogs)
        .where(filters.length > 0 ? and(...filters) : undefined);

      const stats = summary[0] || {
        totalEvents: 0,
        totalCommands: 0,
        totalErrors: 0,
        uniqueUsers: 0,
      };

      // Calculate error rate
      const errorRate =
        stats.totalEvents > 0 ? (stats.totalErrors / stats.totalEvents) * 100 : 0;

      return {
        ...stats,
        errorRate,
      };
    }),

  // Get most active users
  getMostActiveUsers: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  assertDb(db);

      // Build date filters
      const filters = [];
      if (input.startDate) {
        filters.push(gte(botLogs.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        filters.push(lte(botLogs.createdAt, new Date(input.endDate)));
      }

      // Get most active users
      const activeUsers = await db
        .select({
          userId: botLogs.userId,
          username: botLogs.username,
          commandCount: sql<number>`count(*)`.as("commandCount"),
        })
        .from(botLogs)
        .where(
          and(
            eq(botLogs.eventType, "command"),
            isNotNull(botLogs.userId),
            ...(filters.length > 0 ? [and(...filters)] : [])
          )
        )
        .groupBy(botLogs.userId, botLogs.username)
        .orderBy(desc(sql`commandCount`))
        .limit(input.limit);

      return activeUsers;
    }),

  // Export statistics to CSV
  exportStats: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  assertDb(db);

      // Build date filters
      const filters = [];
      if (input.startDate) {
        filters.push(gte(botLogs.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        filters.push(lte(botLogs.createdAt, new Date(input.endDate)));
      }

      // Get all logs for export
      const logs = await db
        .select()
        .from(botLogs)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(botLogs.createdAt))
        .limit(10000); // Limit to 10k rows for performance

      // Convert to CSV format
      const headers = [
        "Timestamp",
        "Event Type",
        "Level",
        "Command",
        "User ID",
        "Username",
        "Channel ID",
        "Message",
        "Details",
      ];

      const rows = logs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.eventType || "",
        log.level || "",
        log.commandName || "",
        log.userId || "",
        log.username || "",
        log.channelId || "",
        log.message || "",
        log.details || "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Escape commas and quotes in CSV
              const escaped = String(cell).replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(",")
        ),
      ].join("\n");

      return {
        csv,
        rowCount: logs.length,
      };
    }),
});
