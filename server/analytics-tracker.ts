/**
 * Analytics Tracker
 * Tracks user activity, messages, and voice stats for analytics dashboard
 */

import { Message, VoiceState } from 'discord.js';
import { getDb } from './db';
import { userActivity, messageStats, voiceStats } from '../drizzle/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

// Track voice session start times
const voiceSessions = new Map<string, number>();

/**
 * Track message activity
 */
export async function trackMessage(message: Message): Promise<void> {
  if (message.author.bot) return;
  
  const db = await getDb();
  if (!db) return;
  
  try {
    const userId = message.author.id;
    const channelId = message.channelId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Update user activity (no date field, just tracks overall activity)
    const existingActivity = await db.select().from(userActivity)
      .where(eq(userActivity.userId, userId));
    
    if (existingActivity.length > 0) {
      await db.update(userActivity)
        .set({
          messageCount: sql`${userActivity.messageCount} + 1`,
          lastActive: new Date(),
        })
        .where(eq(userActivity.id, existingActivity[0].id));
    } else {
      await db.insert(userActivity).values({
        userId,
        username: message.author.username,
        messageCount: 1,
        voiceMinutes: 0,
        lastActive: new Date(),
      });
    }
    
    // Update message stats per user/channel/date
    const existingStats = await db.select().from(messageStats)
      .where(and(
        eq(messageStats.userId, userId),
        eq(messageStats.channelId, channelId),
        eq(messageStats.date, today)
      ));
    
    if (existingStats.length > 0) {
      await db.update(messageStats)
        .set({
          messageCount: sql`${messageStats.messageCount} + 1`,
        })
        .where(eq(messageStats.id, existingStats[0].id));
    } else {
      await db.insert(messageStats).values({
        userId,
        channelId,
        channelName: message.channel && 'name' in message.channel ? message.channel.name : 'Unknown',
        date: today,
        messageCount: 1,
      });
    }
  } catch (error) {
    console.error('[Analytics] Error tracking message:', error);
  }
}

/**
 * Track voice state changes
 */
export async function trackVoiceState(oldState: VoiceState, newState: VoiceState): Promise<void> {
  if (newState.member?.user.bot) return;
  
  const db = await getDb();
  if (!db) return;
  
  try {
    const userId = newState.member?.id;
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // User joined voice channel
    if (!oldState.channelId && newState.channelId) {
      voiceSessions.set(userId, Date.now());
      console.log(`[Analytics] ${newState.member?.user.username} joined voice`);
    }
    
    // User left voice channel
    if (oldState.channelId && !newState.channelId) {
      const sessionStart = voiceSessions.get(userId);
      if (sessionStart) {
        const sessionMinutes = Math.floor((Date.now() - sessionStart) / 60000);
        voiceSessions.delete(userId);
        
        // Update user activity
        const existingActivity = await db.select().from(userActivity)
          .where(eq(userActivity.userId, userId));
        
        if (existingActivity.length > 0) {
          await db.update(userActivity)
            .set({
              voiceMinutes: sql`${userActivity.voiceMinutes} + ${sessionMinutes}`,
              lastActive: new Date(),
            })
            .where(eq(userActivity.id, existingActivity[0].id));
        } else {
          await db.insert(userActivity).values({
            userId,
            username: newState.member?.user.username || 'Unknown',
            messageCount: 0,
            voiceMinutes: sessionMinutes,
            lastActive: new Date(),
          });
        }
        
        // Record voice session
        if (oldState.channelId) {
          await db.insert(voiceStats).values({
            userId,
            channelId: oldState.channelId,
            channelName: oldState.channel?.name || 'Unknown',
            joinedAt: new Date(sessionStart),
            leftAt: new Date(),
            durationMinutes: sessionMinutes,
            date: today,
          });
        }
        
        console.log(`[Analytics] ${newState.member?.user.username} left voice (${sessionMinutes} minutes)`);
      }
    }
    
    // User switched channels
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const sessionStart = voiceSessions.get(userId);
      if (sessionStart) {
        const sessionMinutes = Math.floor((Date.now() - sessionStart) / 60000);
        
        // Record time in old channel
        if (oldState.channelId) {
          await db.insert(voiceStats).values({
            userId,
            channelId: oldState.channelId,
            channelName: oldState.channel?.name || 'Unknown',
            joinedAt: new Date(sessionStart),
            leftAt: new Date(),
            durationMinutes: sessionMinutes,
            date: today,
          });
        }
        
        // Start new session in new channel
        voiceSessions.set(userId, Date.now());
        console.log(`[Analytics] ${newState.member?.user.username} switched voice channels`);
      }
    }
  } catch (error) {
    console.error('[Analytics] Error tracking voice state:', error);
  }
}

/**
 * Get analytics summary for date range
 */
export async function getAnalyticsSummary(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Get total messages
    const messageData = await db.select({
      totalMessages: sql<number>`SUM(${messageStats.messageCount})`,
    }).from(messageStats)
      .where(and(
        gte(messageStats.date, startDate),
        sql`${messageStats.date} <= ${endDate}`
      ));
    
    // Get total voice minutes
    const voiceData = await db.select({
      totalMinutes: sql<number>`SUM(${voiceStats.durationMinutes})`,
    }).from(voiceStats)
      .where(and(
        gte(voiceStats.date, startDate),
        sql`${voiceStats.date} <= ${endDate}`
      ));
    
    // Get active users (from userActivity table, no date filter)
    const activeUsers = await db.select({
      count: sql<number>`COUNT(DISTINCT ${userActivity.userId})`,
    }).from(userActivity);
    
    return {
      totalMessages: messageData[0]?.totalMessages || 0,
      totalVoiceMinutes: voiceData[0]?.totalMinutes || 0,
      activeUsers: activeUsers[0]?.count || 0,
    };
  } catch (error) {
    console.error('[Analytics] Error getting summary:', error);
    return null;
  }
}
