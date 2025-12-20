import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { botMetrics } from "../../shared/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

export const botMetricsRouter = router({
  // Get uptime statistics
  getUptime: publicProcedure
    .input(
      z.object({
        period: z.enum(["current", "24h", "7d", "30d"]).default("current"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (input.period === "current") {
        // Get current session uptime from bot status
        // This will be tracked by the bot itself
        const result = await db
          .select({
            totalUptime: sql<number>`COALESCE(SUM(${botMetrics.metricValue}), 0)`,
            lastRecorded: sql<Date>`MAX(${botMetrics.recordedAt})`,
          })
          .from(botMetrics)
          .where(
            and(
              eq(botMetrics.metricType, "uptime"),
              eq(botMetrics.metricName, "current_session")
            )
          );

        return {
          uptime: result[0]?.totalUptime || 0,
          lastRecorded: result[0]?.lastRecorded || null,
        };
      }

      // Calculate time range
      const now = new Date();
      let startDate = new Date();
      if (input.period === "24h") {
        startDate.setHours(now.getHours() - 24);
      } else if (input.period === "7d") {
        startDate.setDate(now.getDate() - 7);
      } else if (input.period === "30d") {
        startDate.setDate(now.getDate() - 30);
      }

      const result = await db
        .select({
          totalUptime: sql<number>`COALESCE(SUM(${botMetrics.metricValue}), 0)`,
          recordCount: sql<number>`COUNT(*)`,
        })
        .from(botMetrics)
        .where(
          and(
            eq(botMetrics.metricType, "uptime"),
            gte(botMetrics.recordedAt, startDate)
          )
        );

      return {
        uptime: result[0]?.totalUptime || 0,
        recordCount: result[0]?.recordCount || 0,
        period: input.period,
      };
    }),

  // Get command usage statistics
  getCommandStats: publicProcedure
    .input(
      z.object({
        period: z.enum(["24h", "7d", "30d"]).default("24h"),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculate time range
      const now = new Date();
      let startDate = new Date();
      if (input.period === "24h") {
        startDate.setHours(now.getHours() - 24);
      } else if (input.period === "7d") {
        startDate.setDate(now.getDate() - 7);
      } else if (input.period === "30d") {
        startDate.setDate(now.getDate() - 30);
      }

      const result = await db
        .select({
          commandName: botMetrics.metricName,
          count: sql<number>`SUM(${botMetrics.metricValue})`,
        })
        .from(botMetrics)
        .where(
          and(
            eq(botMetrics.metricType, "command"),
            gte(botMetrics.recordedAt, startDate)
          )
        )
        .groupBy(botMetrics.metricName)
        .orderBy(desc(sql`SUM(${botMetrics.metricValue})`))
        .limit(input.limit);

      return result.map((r) => ({
        command: r.commandName,
        count: Number(r.count),
      }));
    }),

  // Get command usage over time (for charts)
  getCommandUsageOverTime: publicProcedure
    .input(
      z.object({
        period: z.enum(["24h", "7d", "30d"]).default("24h"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculate time range
      const now = new Date();
      let startDate = new Date();
      let groupByFormat = "%Y-%m-%d %H:00:00"; // hourly
      if (input.period === "24h") {
        startDate.setHours(now.getHours() - 24);
        groupByFormat = "%Y-%m-%d %H:00:00"; // hourly
      } else if (input.period === "7d") {
        startDate.setDate(now.getDate() - 7);
        groupByFormat = "%Y-%m-%d"; // daily
      } else if (input.period === "30d") {
        startDate.setDate(now.getDate() - 30);
        groupByFormat = "%Y-%m-%d"; // daily
      }

      const result = await db
        .select({
          timeSlot: sql<string>`DATE_FORMAT(${botMetrics.recordedAt}, ${groupByFormat})`,
          count: sql<number>`SUM(${botMetrics.metricValue})`,
        })
        .from(botMetrics)
        .where(
          and(
            eq(botMetrics.metricType, "command"),
            gte(botMetrics.recordedAt, startDate)
          )
        )
        .groupBy(sql`DATE_FORMAT(${botMetrics.recordedAt}, ${groupByFormat})`)
        .orderBy(sql`DATE_FORMAT(${botMetrics.recordedAt}, ${groupByFormat})`);

      return result.map((r) => ({
        time: r.timeSlot,
        count: Number(r.count),
      }));
    }),

  // Get health metrics (errors, response time, etc.)
  getHealthMetrics: publicProcedure
    .input(
      z.object({
        period: z.enum(["24h", "7d", "30d"]).default("24h"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculate time range
      const now = new Date();
      let startDate = new Date();
      if (input.period === "24h") {
        startDate.setHours(now.getHours() - 24);
      } else if (input.period === "7d") {
        startDate.setDate(now.getDate() - 7);
      } else if (input.period === "30d") {
        startDate.setDate(now.getDate() - 30);
      }

      // Get error count
      const errorResult = await db
        .select({
          count: sql<number>`COALESCE(SUM(${botMetrics.metricValue}), 0)`,
        })
        .from(botMetrics)
        .where(
          and(
            eq(botMetrics.metricType, "error"),
            gte(botMetrics.recordedAt, startDate)
          )
        );

      // Get total commands for error rate calculation
      const commandResult = await db
        .select({
          count: sql<number>`COALESCE(SUM(${botMetrics.metricValue}), 0)`,
        })
        .from(botMetrics)
        .where(
          and(
            eq(botMetrics.metricType, "command"),
            gte(botMetrics.recordedAt, startDate)
          )
        );

      const errorCount = Number(errorResult[0]?.count || 0);
      const commandCount = Number(commandResult[0]?.count || 0);
      const errorRate =
        commandCount > 0 ? (errorCount / commandCount) * 100 : 0;

      // Get average response time
      const responseTimeResult = await db
        .select({
          avgResponseTime: sql<number>`COALESCE(AVG(${botMetrics.metricValue}), 0)`,
        })
        .from(botMetrics)
        .where(
          and(
            eq(botMetrics.metricType, "health"),
            eq(botMetrics.metricName, "response_time"),
            gte(botMetrics.recordedAt, startDate)
          )
        );

      return {
        errorCount,
        errorRate: Number(errorRate.toFixed(2)),
        avgResponseTime: Number(responseTimeResult[0]?.avgResponseTime || 0),
        period: input.period,
      };
    }),

  // Record a metric (used by bot)
  recordMetric: publicProcedure
    .input(
      z.object({
        metricType: z.enum(["uptime", "command", "error", "health"]),
        metricName: z.string(),
        metricValue: z.number(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(botMetrics).values({
        metricType: input.metricType,
        metricName: input.metricName,
        metricValue: input.metricValue,
        metadata: input.metadata,
      });

      return { success: true };
    }),
});
