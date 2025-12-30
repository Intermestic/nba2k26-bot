import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  enterDegradationMode,
  exitDegradationMode,
  isDegradationModeActive,
  queueFATransaction,
  queueTradeApproval,
  getQueuedTransactions,
  getQueuedTransactionsByStatus,
  markTransactionCompleted,
  markTransactionFailed,
  getQueueStats,
  formatQueueStatus,
  getDegradationState,
  clearQueue
} from '../graceful-degradation';

/**
 * Integration Tests for Graceful Degradation System
 * 
 * Tests the complete workflow of:
 * 1. Entering degradation mode
 * 2. Queueing transactions
 * 3. Monitoring queue status
 * 4. Processing transactions
 * 5. Exiting degradation mode
 */

describe('Graceful Degradation Integration Tests', () => {
  
  beforeEach(() => {
    // Clear state before each test
    clearQueue();
    if (isDegradationModeActive()) {
      exitDegradationMode();
    }
  });

  afterEach(() => {
    clearQueue();
    if (isDegradationModeActive()) {
      exitDegradationMode();
    }
  });

  describe('Degradation Mode Lifecycle', () => {
    it('should enter and exit degradation mode correctly', () => {
      expect(isDegradationModeActive()).toBe(false);

      enterDegradationMode();
      expect(isDegradationModeActive()).toBe(true);

      const state = getDegradationState();
      expect(state.isActive).toBe(true);
      expect(state.activeSince).toBeGreaterThan(0);

      exitDegradationMode();
      expect(isDegradationModeActive()).toBe(false);
    });

    it('should track degradation uptime', async () => {
      enterDegradationMode();
      const state1 = getDegradationState();

      await new Promise(resolve => setTimeout(resolve, 100));

      const state2 = getDegradationState();
      expect(state2.uptime).toBeGreaterThan(state1.uptime);
    });

    it('should prevent duplicate mode entry', () => {
      enterDegradationMode();
      const state1 = getDegradationState();

      // Try to enter again
      enterDegradationMode();
      const state2 = getDegradationState();

      // Should have same activeSince timestamp
      expect(state1.activeSince).toBe(state2.activeSince);
    });
  });

  describe('FA Transaction Queueing', () => {
    it('should queue FA transactions in degradation mode', () => {
      enterDegradationMode();

      const tx = queueFATransaction(
        'Player1',
        'Player2',
        5,
        'Lakers',
        'user123',
        'msg123'
      );

      expect(tx.type).toBe('fa-transaction');
      expect(tx.dropPlayer).toBe('Player1');
      expect(tx.signPlayer).toBe('Player2');
      expect(tx.bidAmount).toBe(5);
      expect(tx.status).toBe('queued');
      expect(tx.retries).toBe(0);
    });

    it('should queue multiple FA transactions', () => {
      enterDegradationMode();

      const tx1 = queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      const tx2 = queueFATransaction('P3', 'P4', 3, 'Celtics', 'user2', 'msg2');
      const tx3 = queueFATransaction('P5', 'P6', 2, 'Warriors', 'user3', 'msg3');

      const queued = getQueuedTransactionsByStatus('queued');
      expect(queued).toHaveLength(3);
    });

    it('should track transaction retry count', () => {
      enterDegradationMode();

      const tx = queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      expect(tx.retries).toBe(0);
      expect(tx.maxRetries).toBe(3);

      markTransactionFailed(tx.id, 'Test error');
      const updated = getQueuedTransactions().find(t => t.id === tx.id);
      expect(updated?.retries).toBe(1);
      expect(updated?.status).toBe('queued'); // Reset to queued for retry
    });
  });

  describe('Trade Approval Queueing', () => {
    it('should queue trade approvals in degradation mode', () => {
      enterDegradationMode();

      const tx = queueTradeApproval('msg123', 'Lakers', 'Celtics', 'user123');

      expect(tx.type).toBe('trade-approval');
      expect(tx.messageId).toBe('msg123');
      expect(tx.team1).toBe('Lakers');
      expect(tx.team2).toBe('Celtics');
      expect(tx.status).toBe('queued');
    });

    it('should queue multiple trade approvals', () => {
      enterDegradationMode();

      queueTradeApproval('msg1', 'Lakers', 'Celtics', 'user1');
      queueTradeApproval('msg2', 'Warriors', 'Nets', 'user2');
      queueTradeApproval('msg3', 'Heat', 'Bucks', 'user3');

      const queued = getQueuedTransactionsByStatus('queued');
      expect(queued).toHaveLength(3);
    });
  });

  describe('Queue Status Tracking', () => {
    it('should provide accurate queue statistics', () => {
      enterDegradationMode();

      queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      queueFATransaction('P3', 'P4', 3, 'Celtics', 'user2', 'msg2');
      queueTradeApproval('msg3', 'Warriors', 'Nets', 'user3');

      const stats = getQueueStats();
      expect(stats.total).toBe(3);
      expect(stats.faTransactions).toBe(2);
      expect(stats.tradeApprovals).toBe(1);
      expect(stats.queued).toBe(3);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it('should track transaction status changes', () => {
      enterDegradationMode();

      const tx = queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      let stats = getQueueStats();
      expect(stats.queued).toBe(1);

      markTransactionCompleted(tx.id);
      stats = getQueueStats();
      expect(stats.completed).toBe(1);
      expect(stats.queued).toBe(0);
    });

    it('should format queue status for Discord messages', () => {
      enterDegradationMode();

      queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      queueFATransaction('P3', 'P4', 3, 'Celtics', 'user2', 'msg2');

      const status = formatQueueStatus();
      expect(status).toContain('⚠️ **System Degraded**');
      expect(status).toContain('2 transactions queued');
      expect(status).toContain('FA Moves: 2');
      expect(status).toContain('Trades: 0');
    });

    it('should show normal status when not degraded', () => {
      const status = formatQueueStatus();
      expect(status).toContain('✅ **System Status**: All systems operational');
    });
  });

  describe('Mixed Transaction Types', () => {
    it('should handle mixed FA and trade transactions', () => {
      enterDegradationMode();

      // Queue mixed transactions
      const fa1 = queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      const trade1 = queueTradeApproval('msg2', 'Warriors', 'Nets', 'user2');
      const fa2 = queueFATransaction('P3', 'P4', 3, 'Celtics', 'user3', 'msg3');
      const trade2 = queueTradeApproval('msg4', 'Heat', 'Bucks', 'user4');

      const stats = getQueueStats();
      expect(stats.total).toBe(4);
      expect(stats.faTransactions).toBe(2);
      expect(stats.tradeApprovals).toBe(2);

      // Process some transactions
      markTransactionCompleted(fa1.id);
      markTransactionCompleted(trade1.id);

      const updated = getQueueStats();
      expect(updated.completed).toBe(2);
      expect(updated.queued).toBe(2);
    });

    it('should handle transaction failures and retries', () => {
      enterDegradationMode();

      const fa = queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      const trade = queueTradeApproval('msg2', 'Warriors', 'Nets', 'user2');

      // Simulate failures
      markTransactionFailed(fa.id, 'Connection timeout');
      markTransactionFailed(trade.id, 'Database error');

      const stats = getQueueStats();
      expect(stats.queued).toBe(2); // Both reset to queued for retry
      expect(stats.failed).toBe(0); // No permanent failures yet

      // Fail again
      markTransactionFailed(fa.id, 'Still failing');
      markTransactionFailed(fa.id, 'Still failing');

      // Check if transaction is still retrying
      const faTransaction = getQueuedTransactions().find(t => t.id === fa.id);
      expect(faTransaction?.retries).toBe(3);
      expect(faTransaction?.status).toBe('failed'); // Max retries reached
    });
  });

  describe('Queue Limits', () => {
    it('should enforce maximum queue size', () => {
      enterDegradationMode();

      // Queue transactions up to limit
      for (let i = 0; i < 100; i++) {
        queueFATransaction(`P${i}`, `P${i + 1}`, 1, 'Lakers', 'user', `msg${i}`);
      }

      const stats = getQueueStats();
      expect(stats.total).toBe(100);

      // Try to exceed limit
      expect(() => {
        for (let i = 0; i < 950; i++) {
          queueFATransaction(`P${i}`, `P${i + 1}`, 1, 'Lakers', 'user', `msg${i}`);
        }
      }).toThrow('Transaction queue full');

      // Should be at max
      const finalStats = getQueueStats();
      expect(finalStats.total).toBeLessThanOrEqual(1000);
    });
  });

  describe('Queue Persistence Across Mode Changes', () => {
    it('should maintain queue when exiting and re-entering degradation mode', () => {
      enterDegradationMode();

      const tx1 = queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      const tx2 = queueFATransaction('P3', 'P4', 3, 'Celtics', 'user2', 'msg2');

      let stats = getQueueStats();
      expect(stats.total).toBe(2);

      exitDegradationMode();

      // Queue should still be there
      stats = getQueueStats();
      expect(stats.total).toBe(2);

      // Re-enter degradation mode
      enterDegradationMode();
      stats = getQueueStats();
      expect(stats.total).toBe(2);
    });
  });

  describe('Degradation State Information', () => {
    it('should provide complete degradation state', async () => {
      enterDegradationMode();

      queueFATransaction('P1', 'P2', 5, 'Lakers', 'user1', 'msg1');
      queueFATransaction('P3', 'P4', 3, 'Celtics', 'user2', 'msg2');

      await new Promise(resolve => setTimeout(resolve, 50));

      const state = getDegradationState();
      expect(state.isActive).toBe(true);
      expect(state.activeSince).toBeGreaterThan(0);
      expect(state.uptime).toBeGreaterThan(0);
      expect(state.queueSize).toBe(2);
      expect(state.recoveryAttemptCount).toBe(0);
    });
  });
});
