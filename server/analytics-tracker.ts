/**
 * Analytics Tracker Stub
 * This module was removed as part of bot refactoring to keep only core features.
 * This stub prevents import errors in routers/analytics.ts
 */

export interface AnalyticsSummary {
  totalMessages: number;
  totalVoiceMinutes: number;
  activeUsers: number;
  topChannels: Array<{ channelId: string; count: number }>;
}

/**
 * Get analytics summary (stub - returns empty data)
 */
export async function getAnalyticsSummary(startDate?: Date | string, endDate?: Date | string): Promise<AnalyticsSummary> {
  return {
    totalMessages: 0,
    totalVoiceMinutes: 0,
    activeUsers: 0,
    topChannels: []
  };
}

/**
 * Track message (stub - does nothing)
 */
export async function trackMessage(message: any): Promise<void> {
  // No-op: analytics tracking disabled
}

/**
 * Track voice state (stub - does nothing)
 */
export async function trackVoiceState(oldState: any, newState: any): Promise<void> {
  // No-op: analytics tracking disabled
}
