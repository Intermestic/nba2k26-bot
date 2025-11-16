/**
 * Analytics Router
 * TRPC endpoints for retrieving server analytics and activity stats
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db.js";
import { userActivity, messageStats, voiceStats } from '../../drizzle/schema.js';
import { desc, sql, and, gte } from "drizzle-orm";
import { getAnalyticsSummary } from "../analytics-tracker.js";

export const analyticsRouter = router({
  /**
   * Get overall server statistics
   */
  getServerStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get total active users
    const totalUsers = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(userActivity);
    
    // Get total messages
    const totalMessages = await db.select({
      sum: sql<number>`SUM(${userActivity.messageCount})`,
    }).from(userActivity);
    
    // Get total voice minutes
    const totalVoice = await db.select({
      sum: sql<number>`SUM(${userActivity.voiceMinutes})`,
    }).from(userActivity);
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's messages
    const todayMessages = await db.select({
      sum: sql<number>`SUM(${messageStats.messageCount})`,
    }).from(messageStats)
      .where(sql`${messageStats.date} = ${today}`);
    
    // Get today's voice minutes
    const todayVoice = await db.select({
      sum: sql<number>`SUM(${voiceStats.durationMinutes})`,
    }).from(voiceStats)
      .where(sql`${voiceStats.date} = ${today}`);
    
    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalMessages: totalMessages[0]?.sum || 0,
      totalVoiceMinutes: totalVoice[0]?.sum || 0,
      todayMessages: todayMessages[0]?.sum || 0,
      todayVoiceMinutes: todayVoice[0]?.sum || 0,
    };
  }),

  /**
   * Get top active users
   */
  getTopUsers: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      sortBy: z.enum(["messages", "voice"]).default("messages"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const sortColumn = input.sortBy === "messages" 
        ? userActivity.messageCount 
        : userActivity.voiceMinutes;
      
      const users = await db.select()
        .from(userActivity)
        .orderBy(desc(sortColumn))
        .limit(input.limit);
      
      return users;
    }),

  /**
   * Get message activity by channel
   */
  getChannelActivity: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const channels = await db.select({
        channelId: messageStats.channelId,
        channelName: messageStats.channelName,
        totalMessages: sql<number>`SUM(${messageStats.messageCount})`,
      })
        .from(messageStats)
        .where(gte(messageStats.date, startDateStr))
        .groupBy(messageStats.channelId, messageStats.channelName)
        .orderBy(desc(sql`SUM(${messageStats.messageCount})`));
      
      return channels;
    }),

  /**
   * Get voice activity by channel
   */
  getVoiceActivity: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const channels = await db.select({
        channelId: voiceStats.channelId,
        channelName: voiceStats.channelName,
        totalMinutes: sql<number>`SUM(${voiceStats.durationMinutes})`,
        sessions: sql<number>`COUNT(*)`,
      })
        .from(voiceStats)
        .where(gte(voiceStats.date, startDateStr))
        .groupBy(voiceStats.channelId, voiceStats.channelName)
        .orderBy(desc(sql`SUM(${voiceStats.durationMinutes})`));
      
      return channels;
    }),

  /**
   * Get activity timeline (messages per day)
   */
  getActivityTimeline: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const timeline = await db.select({
        date: messageStats.date,
        messages: sql<number>`SUM(${messageStats.messageCount})`,
      })
        .from(messageStats)
        .where(gte(messageStats.date, startDateStr))
        .groupBy(messageStats.date)
        .orderBy(messageStats.date);
      
      return timeline;
    }),

  /**
   * Get user details
   */
  getUserDetails: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get user activity summary
      const user = await db.select()
        .from(userActivity)
        .where(sql`${userActivity.userId} = ${input.userId}`)
        .limit(1);
      
      if (user.length === 0) {
        return null;
      }
      
      // Get message breakdown by channel
      const messageBreakdown = await db.select({
        channelId: messageStats.channelId,
        channelName: messageStats.channelName,
        messages: sql<number>`SUM(${messageStats.messageCount})`,
      })
        .from(messageStats)
        .where(sql`${messageStats.userId} = ${input.userId}`)
        .groupBy(messageStats.channelId, messageStats.channelName)
        .orderBy(desc(sql`SUM(${messageStats.messageCount})`));
      
      // Get voice breakdown by channel
      const voiceBreakdown = await db.select({
        channelId: voiceStats.channelId,
        channelName: voiceStats.channelName,
        minutes: sql<number>`SUM(${voiceStats.durationMinutes})`,
        sessions: sql<number>`COUNT(*)`,
      })
        .from(voiceStats)
        .where(sql`${voiceStats.userId} = ${input.userId}`)
        .groupBy(voiceStats.channelId, voiceStats.channelName)
        .orderBy(desc(sql`SUM(${voiceStats.durationMinutes})`));
      
      return {
        user: user[0],
        messageBreakdown,
        voiceBreakdown,
      };
    }),

  /**
   * Get analytics summary for date range
   */
  getSummary: protectedProcedure
    .input(z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ input }) => {
      const summary = await getAnalyticsSummary(input.startDate, input.endDate);
      return summary;
    }),
});
