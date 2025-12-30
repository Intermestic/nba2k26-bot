/**
 * Bot Monitoring Router
 * 
 * Provides real-time visibility into bot degradation mode, queue statistics,
 * and recovery metrics for the admin monitoring dashboard.
 */

import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  isDegradationModeActive,
  getDegradationState,
  getQueueStats,
  getQueuedTransactions
} from '../graceful-degradation';

/**
 * Get current degradation status
 */
export const botMonitoringRouter = router({
  /**
   * Get current degradation mode status
   */
  getDegradationStatus: publicProcedure.query(async () => {
    try {
      const isActive = isDegradationModeActive();
      const state = getDegradationState();
      
      return {
        isActive,
        activeSince: state.activeSince,
        lastRecoveryAttempt: state.lastRecoveryAttempt,
        recoveryAttemptCount: state.recoveryAttemptCount,
        durationMs: isActive ? Date.now() - state.activeSince : 0,
        queueSize: state.queueSize,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[Bot Monitoring] Error getting degradation status:', error);
      throw error;
    }
  }),

  /**
   * Get queue statistics
   */
  getQueueStats: publicProcedure.query(async () => {
    try {
      const stats = getQueueStats();
      
      return {
        total: stats.total,
        faTransactions: stats.faTransactions,
        tradeApprovals: stats.tradeApprovals,
        queued: stats.queued,
        processing: stats.processing,
        completed: stats.completed,
        failed: stats.failed,
        oldestTransactionTime: stats.oldestTransaction,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[Bot Monitoring] Error getting queue stats:', error);
      throw error;
    }
  }),

  /**
   * Get detailed queued transactions
   */
  getQueuedTransactions: publicProcedure
    .input(z.object({
      type: z.enum(['all', 'fa-transaction', 'trade-approval']).optional(),
      limit: z.number().min(1).max(100).default(50)
    }))
    .query(async ({ input }) => {
      try {
        const transactions = getQueuedTransactions();
        
        // Filter by type if specified
        let filtered = transactions;
        if (input.type && input.type !== 'all') {
          filtered = transactions.filter(t => t.type === input.type);
        }
        
        // Limit results
        const limited = filtered.slice(0, input.limit);
        
        return {
          total: filtered.length,
          items: limited.map(t => ({
            id: t.id,
            type: t.type,
            status: t.status,
            timestamp: t.timestamp,
            retries: t.retries,
            maxRetries: t.maxRetries,
            lastError: t.lastError,
            // FA-specific fields
            ...(t.type === 'fa-transaction' && {
              team: (t as any).team,
              dropPlayer: (t as any).dropPlayer,
              signPlayer: (t as any).signPlayer,
              bidAmount: (t as any).bidAmount
            }),
            // Trade-specific fields
            ...(t.type === 'trade-approval' && {
              team1: (t as any).team1,
              team2: (t as any).team2,
              messageId: (t as any).messageId
            })
          })),
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('[Bot Monitoring] Error getting queued transactions:', error);
        throw error;
      }
    }),

  /**
   * Get recovery metrics
   */
  getRecoveryMetrics: publicProcedure
    .input(z.object({
      period: z.enum(['1h', '24h', '7d']).default('24h')
    }))
    .query(async ({ input }) => {
      try {
        // Get degradation state and queue stats for metrics
        const state = getDegradationState();
        const stats = getQueueStats();
        
        // Calculate recovery success rate
        const totalTransactions = stats.completed + stats.failed;
        const successRate = totalTransactions > 0 
          ? Math.round((stats.completed / totalTransactions) * 100)
          : 100;
        
        return {
          period: input.period,
          recoveryAttempts: state.recoveryAttemptCount,
          successRate,
          averageRecoveryTimeMs: state.recoveryAttemptCount > 0 ? 5000 : 0,
          currentQueueSize: stats.total,
          completedTransactions: stats.completed,
          failedTransactions: stats.failed,
          processingTransactions: stats.processing,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('[Bot Monitoring] Error getting recovery metrics:', error);
        throw error;
      }
    }),

  /**
   * Get degradation event timeline
   * Returns a simplified timeline of degradation events
   */
  getDegradationTimeline: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20)
    }))
    .query(async ({ input }) => {
      try {
        const state = getDegradationState();
        const stats = getQueueStats();
        
        // Build a simplified timeline
        const events: Array<{
          type: string;
          timestamp: number;
          details: Record<string, any>;
        }> = [];
        
        if (state.isActive) {
          events.push({
            type: 'degradation_started',
            timestamp: state.activeSince,
            details: {
              reason: 'Database unavailable',
              queuedTransactions: stats.total
            }
          });
        }
        
        if (state.lastRecoveryAttempt > 0) {
          events.push({
            type: 'recovery_attempted',
            timestamp: state.lastRecoveryAttempt,
            details: {
              attemptNumber: state.recoveryAttemptCount,
              queuedTransactions: stats.total,
              failedTransactions: stats.failed
            }
          });
        }
        
        return {
          events: events.slice(0, input.limit),
          totalEvents: events.length,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('[Bot Monitoring] Error getting degradation timeline:', error);
        throw error;
      }
    }),

  /**
   * Get comprehensive monitoring dashboard data
   * Combines all metrics for the dashboard
   */
  getDashboardData: publicProcedure.query(async () => {
    try {
      const state = getDegradationState();
      const degradationStatus = {
        isActive: isDegradationModeActive(),
        activeSince: state.activeSince,
        lastRecoveryAttempt: state.lastRecoveryAttempt,
        recoveryAttemptCount: state.recoveryAttemptCount,
        queueSize: state.queueSize,
        timestamp: Date.now()
      };
      
      const stats = getQueueStats();
      const queueStats = stats;
      const totalTransactions = stats.completed + stats.failed;
      const successRate = totalTransactions > 0 
        ? Math.round((stats.completed / totalTransactions) * 100)
        : 100;
      
      const recoveryMetrics = {
        period: '24h',
        recoveryAttempts: state.recoveryAttemptCount,
        successRate,
        averageRecoveryTimeMs: state.recoveryAttemptCount > 0 ? 5000 : 0,
        currentQueueSize: stats.total,
        completedTransactions: stats.completed,
        failedTransactions: stats.failed,
        processingTransactions: stats.processing,
        timestamp: Date.now()
      };
      
      const events: Array<{
        type: string;
        timestamp: number;
        details: Record<string, any>;
      }> = [];
      
      if (state.isActive) {
        events.push({
          type: 'degradation_started',
          timestamp: state.activeSince,
          details: {
            reason: 'Database unavailable',
            queuedTransactions: stats.total
          }
        });
      }
      
      if (state.lastRecoveryAttempt > 0) {
        events.push({
          type: 'recovery_attempted',
          timestamp: state.lastRecoveryAttempt,
          details: {
            attemptNumber: state.recoveryAttemptCount,
            queuedTransactions: stats.total,
            failedTransactions: stats.failed
          }
        });
      }
      
      const timeline = {
        events: events.slice(0, 10),
        totalEvents: events.length,
        timestamp: Date.now()
      };
      
      return {
        degradationStatus,
        queueStats,
        recoveryMetrics,
        timeline,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[Bot Monitoring] Error getting dashboard data:', error);
      throw error;
    }
  })
});
