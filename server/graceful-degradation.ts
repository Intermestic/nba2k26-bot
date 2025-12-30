/**
 * Graceful Degradation System
 * 
 * Allows the bot to continue processing FA moves and trades with reduced functionality
 * when the database is temporarily unavailable. Transactions are queued locally and
 * automatically processed when the database recovers.
 */

import { Message } from 'discord.js';

export interface QueuedFATransaction {
  id: string;
  type: 'fa-transaction';
  dropPlayer: string;
  signPlayer: string;
  bidAmount: number;
  team: string;
  userId: string;
  messageId: string;
  timestamp: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  retries: number;
  maxRetries: number;
  lastError?: string;
}

export interface QueuedTradeApproval {
  id: string;
  type: 'trade-approval';
  messageId: string;
  team1: string;
  team2: string;
  userId: string;
  timestamp: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  retries: number;
  maxRetries: number;
  lastError?: string;
}

export type QueuedTransaction = QueuedFATransaction | QueuedTradeApproval;

interface DegradationState {
  isActive: boolean;
  activeSince: number;
  lastRecoveryAttempt: number;
  recoveryAttemptCount: number;
}

// Global state
let degradationState: DegradationState = {
  isActive: false,
  activeSince: 0,
  lastRecoveryAttempt: 0,
  recoveryAttemptCount: 0
};

const transactionQueue: Map<string, QueuedTransaction> = new Map();
const MAX_QUEUE_SIZE = 1000;
const QUEUE_PERSISTENCE_FILE = '/tmp/nba2k26-transaction-queue.json';
const RECOVERY_CHECK_INTERVAL = 5000; // Check every 5 seconds
const RECOVERY_TIMEOUT = 30000; // Give up after 30 seconds

/**
 * Enter graceful degradation mode
 */
export function enterDegradationMode(): void {
  if (degradationState.isActive) return;

  degradationState.isActive = true;
  degradationState.activeSince = Date.now();
  degradationState.lastRecoveryAttempt = 0;
  degradationState.recoveryAttemptCount = 0;

  console.warn('[Graceful Degradation] ENTERING DEGRADED MODE - Database unavailable');
  console.warn(`[Graceful Degradation] Transactions will be queued locally and processed when DB recovers`);
}

/**
 * Exit graceful degradation mode
 */
export function exitDegradationMode(): void {
  if (!degradationState.isActive) return;

  const duration = Date.now() - degradationState.activeSince;
  const queuedCount = transactionQueue.size;

  degradationState.isActive = false;

  console.log(`[Graceful Degradation] EXITING DEGRADED MODE after ${Math.round(duration / 1000)}s`);
  console.log(`[Graceful Degradation] Processing ${queuedCount} queued transactions`);
}

/**
 * Check if in degradation mode
 */
export function isDegradationModeActive(): boolean {
  return degradationState.isActive;
}

/**
 * Get degradation state info
 */
export function getDegradationState() {
  return {
    ...degradationState,
    queueSize: transactionQueue.size,
    uptime: degradationState.isActive ? Date.now() - degradationState.activeSince : 0
  };
}

/**
 * Queue a FA transaction for later processing
 */
export function queueFATransaction(
  dropPlayer: string,
  signPlayer: string,
  bidAmount: number,
  team: string,
  userId: string,
  messageId: string
): QueuedFATransaction {
  if (transactionQueue.size >= MAX_QUEUE_SIZE) {
    throw new Error(`Transaction queue full (${MAX_QUEUE_SIZE} items)`);
  }

  const transaction: QueuedFATransaction = {
    id: `fa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'fa-transaction',
    dropPlayer,
    signPlayer,
    bidAmount,
    team,
    userId,
    messageId,
    timestamp: Date.now(),
    status: 'queued',
    retries: 0,
    maxRetries: 3
  };

  transactionQueue.set(transaction.id, transaction);
  console.log(`[Graceful Degradation] Queued FA transaction: ${transaction.id} (${team}: ${dropPlayer} → ${signPlayer})`);

  return transaction;
}

/**
 * Queue a trade approval for later processing
 */
export function queueTradeApproval(
  messageId: string,
  team1: string,
  team2: string,
  userId: string
): QueuedTradeApproval {
  if (transactionQueue.size >= MAX_QUEUE_SIZE) {
    throw new Error(`Transaction queue full (${MAX_QUEUE_SIZE} items)`);
  }

  const transaction: QueuedTradeApproval = {
    id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'trade-approval',
    messageId,
    team1,
    team2,
    userId,
    timestamp: Date.now(),
    status: 'queued',
    retries: 0,
    maxRetries: 3
  };

  transactionQueue.set(transaction.id, transaction);
  console.log(`[Graceful Degradation] Queued trade approval: ${transaction.id} (${team1} ↔ ${team2})`);

  return transaction;
}

/**
 * Get all queued transactions
 */
export function getQueuedTransactions(): QueuedTransaction[] {
  return Array.from(transactionQueue.values());
}

/**
 * Get queued transactions by status
 */
export function getQueuedTransactionsByStatus(status: string): QueuedTransaction[] {
  return Array.from(transactionQueue.values()).filter(t => t.status === status);
}

/**
 * Mark transaction as processing
 */
export function markTransactionProcessing(transactionId: string): void {
  const transaction = transactionQueue.get(transactionId);
  if (transaction) {
    transaction.status = 'processing';
  }
}

/**
 * Mark transaction as completed
 */
export function markTransactionCompleted(transactionId: string): void {
  const transaction = transactionQueue.get(transactionId);
  if (transaction) {
    transaction.status = 'completed';
    console.log(`[Graceful Degradation] Completed: ${transactionId}`);
  }
}

/**
 * Mark transaction as failed
 */
export function markTransactionFailed(transactionId: string, error: string): void {
  const transaction = transactionQueue.get(transactionId);
  if (transaction) {
    transaction.status = 'failed';
    transaction.lastError = error;
    transaction.retries++;

    if (transaction.retries >= transaction.maxRetries) {
      console.error(`[Graceful Degradation] Failed permanently: ${transactionId} after ${transaction.retries} retries`);
      console.error(`[Graceful Degradation] Error: ${error}`);
    } else {
      console.warn(`[Graceful Degradation] Failed: ${transactionId} (retry ${transaction.retries}/${transaction.maxRetries})`);
      // Reset status to queued for retry
      transaction.status = 'queued';
    }
  }
}

/**
 * Remove transaction from queue
 */
export function removeTransaction(transactionId: string): void {
  transactionQueue.delete(transactionId);
}

/**
 * Clear all queued transactions
 */
export function clearQueue(): void {
  const count = transactionQueue.size;
  transactionQueue.clear();
  console.log(`[Graceful Degradation] Cleared ${count} queued transactions`);
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  const transactions = Array.from(transactionQueue.values());
  const faTransactions = transactions.filter(t => t.type === 'fa-transaction');
  const tradeApprovals = transactions.filter(t => t.type === 'trade-approval');

  return {
    total: transactions.length,
    faTransactions: faTransactions.length,
    tradeApprovals: tradeApprovals.length,
    queued: transactions.filter(t => t.status === 'queued').length,
    processing: transactions.filter(t => t.status === 'processing').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    oldestTransaction: transactions.length > 0 ? Math.min(...transactions.map(t => t.timestamp)) : null
  };
}

/**
 * Start recovery monitoring
 * Periodically attempts to process queued transactions when DB becomes available
 */
export function startRecoveryMonitoring(
  isDbAvailable: () => Promise<boolean>,
  processQueuedTransactions: () => Promise<void>
): NodeJS.Timeout {
  return setInterval(async () => {
    if (!degradationState.isActive) return;

    try {
      const available = await isDbAvailable();
      if (available) {
        degradationState.lastRecoveryAttempt = Date.now();
        degradationState.recoveryAttemptCount++;

        console.log(`[Graceful Degradation] Database recovered! Processing queued transactions...`);
        await processQueuedTransactions();
        exitDegradationMode();
      }
    } catch (error) {
      console.error('[Graceful Degradation] Recovery check failed:', error);
    }
  }, RECOVERY_CHECK_INTERVAL);
}

/**
 * Format queue status for Discord message
 */
export function formatQueueStatus(): string {
  const stats = getQueueStats();
  const state = getDegradationState();

  if (!state.isActive) {
    return '✅ **System Status**: All systems operational';
  }

  const uptime = Math.round(state.uptime / 1000);
  const lines = [
    `⚠️ **System Degraded** (${uptime}s)`,
    `📊 **Queue Status**: ${stats.total} transactions queued`,
    `  • FA Moves: ${stats.faTransactions}`,
    `  • Trades: ${stats.tradeApprovals}`,
    `  • Status: ${stats.queued} queued, ${stats.processing} processing, ${stats.completed} completed`,
    `💡 Transactions will be processed automatically when the database recovers.`
  ];

  return lines.join('\n');
}

/**
 * Log queue status periodically
 */
export function startQueueStatusLogging(interval: number = 30000): NodeJS.Timeout {
  return setInterval(() => {
    if (!degradationState.isActive) return;

    const stats = getQueueStats();
    console.log('[Graceful Degradation] Queue Status:', stats);
  }, interval);
}
