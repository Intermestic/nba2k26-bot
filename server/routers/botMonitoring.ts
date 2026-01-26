import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { botHealthMetrics } from "../../drizzle/schema";
import { desc, sql, gte } from "drizzle-orm";
import { z } from "zod";

/**
 * Bot Monitoring Router
 * 
 * Provides API endpoints for the bot monitoring dashboard
 */

export const botMonitoringRouter = router({
  /**
   * Get current bot status (latest health check)
   */
  getCurrentStatus: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const latest = await db
      .select()
      .from(botHealthMetrics)
      .orderBy(desc(botHealthMetrics.timestamp))
      .limit(1);

    if (latest.length === 0) {
      return null;
    }

    return latest[0];
  }),

  /**
   * Get health metrics for a time range
   */
  getMetrics: publicProcedure
    .input(
      z.object({
        hours: z.number().min(1).max(168).default(24), // 1 hour to 7 days
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Calculate timestamp for X hours ago
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - input.hours);

      const metrics = await db
        .select()
        .from(botHealthMetrics)
        .where(gte(botHealthMetrics.timestamp, hoursAgo))
        .orderBy(botHealthMetrics.timestamp);

      return metrics;
    }),

  /**
   * Get uptime statistics
   */
  getUptimeStats: publicProcedure
    .input(
      z.object({
        hours: z.number().min(1).max(168).default(24),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - input.hours);

      // Get all metrics in the time range
      const metrics = await db
        .select()
        .from(botHealthMetrics)
        .where(gte(botHealthMetrics.timestamp, hoursAgo));

      if (metrics.length === 0) {
        return {
          totalChecks: 0,
          healthyChecks: 0,
          degradedChecks: 0,
          unhealthyChecks: 0,
          uptimePercentage: 0,
          avgHealthResponseTime: 0,
          avgWebResponseTime: 0,
          avgErrors: 0,
        };
      }

      const totalChecks = metrics.length;
      const healthyChecks = metrics.filter((m) => m.status === "healthy").length;
      const degradedChecks = metrics.filter((m) => m.status === "degraded").length;
      const unhealthyChecks = metrics.filter((m) => m.status === "unhealthy").length;

      const uptimePercentage = ((healthyChecks + degradedChecks) / totalChecks) * 100;

      const avgHealthResponseTime =
        metrics.reduce((sum, m) => sum + m.healthResponseTime, 0) / totalChecks;

      const webMetrics = metrics.filter((m) => m.webResponseTime !== null);
      const avgWebResponseTime =
        webMetrics.length > 0
          ? webMetrics.reduce((sum, m) => sum + (m.webResponseTime || 0), 0) / webMetrics.length
          : 0;

      const avgErrors = metrics.reduce((sum, m) => sum + m.errors, 0) / totalChecks;

      return {
        totalChecks,
        healthyChecks,
        degradedChecks,
        unhealthyChecks,
        uptimePercentage: Math.round(uptimePercentage * 100) / 100,
        avgHealthResponseTime: Math.round(avgHealthResponseTime * 100) / 100,
        avgWebResponseTime: Math.round(avgWebResponseTime * 100) / 100,
        avgErrors: Math.round(avgErrors * 100) / 100,
      };
    }),

  /**
   * Get response time trends (grouped by hour)
   */
  getResponseTimeTrends: publicProcedure
    .input(
      z.object({
        hours: z.number().min(1).max(168).default(24),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - input.hours);

      // Get metrics grouped by hour
      const trends = await db
        .select({
          hour: sql<string>`DATE_FORMAT(${botHealthMetrics.timestamp}, '%Y-%m-%d %H:00:00')`,
          avgHealthResponseTime: sql<number>`AVG(${botHealthMetrics.healthResponseTime})`,
          avgWebResponseTime: sql<number>`AVG(${botHealthMetrics.webResponseTime})`,
          avgErrors: sql<number>`AVG(${botHealthMetrics.errors})`,
          healthyCount: sql<number>`SUM(CASE WHEN ${botHealthMetrics.status} = 'healthy' THEN 1 ELSE 0 END)`,
          totalCount: sql<number>`COUNT(*)`,
        })
        .from(botHealthMetrics)
        .where(gte(botHealthMetrics.timestamp, hoursAgo))
        .groupBy(sql`DATE_FORMAT(${botHealthMetrics.timestamp}, '%Y-%m-%d %H:00:00')`)
        .orderBy(sql`DATE_FORMAT(${botHealthMetrics.timestamp}, '%Y-%m-%d %H:00:00')`);

      return trends.map((t) => ({
        hour: t.hour,
        avgHealthResponseTime: Math.round((t.avgHealthResponseTime || 0) * 100) / 100,
        avgWebResponseTime: Math.round((t.avgWebResponseTime || 0) * 100) / 100,
        avgErrors: Math.round((t.avgErrors || 0) * 100) / 100,
        uptimePercentage: Math.round(((t.healthyCount || 0) / (t.totalCount || 1)) * 10000) / 100,
      }));
    }),
});
