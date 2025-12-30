/**
 * Recovery Service
 * 
 * Monitors database availability and automatically processes queued transactions
 * when the database recovers from temporary outages.
 */

import { isDegradationModeActive, exitDegradationMode, getQueueStats } from './graceful-degradation';
import { processQueuedFATransactions, isDatabaseAvailable as isFADbAvailable } from './fa-transaction-processor';
import { processQueuedTradeApprovals, isDatabaseAvailable as isTradeDbAvailable } from './trade-processor';

interface RecoveryServiceConfig {
  checkInterval: number; // How often to check database availability (ms)
  recoveryTimeout: number; // How long to wait for recovery before giving up (ms)
  maxRetryAttempts: number; // Max attempts to process queued transactions
}

const DEFAULT_CONFIG: RecoveryServiceConfig = {
  checkInterval: 5000, // Check every 5 seconds
  recoveryTimeout: 30000, // Give up after 30 seconds
  maxRetryAttempts: 3
};

let recoveryInterval: NodeJS.Timeout | null = null;
let statusLoggingInterval: NodeJS.Timeout | null = null;
let recoveryAttempts = 0;

/**
 * Start the recovery service
 */
export function startRecoveryService(config: Partial<RecoveryServiceConfig> = {}): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (recoveryInterval) {
    console.warn('[Recovery Service] Recovery service already running');
    return;
  }

  console.log('[Recovery Service] Starting recovery service...');
  console.log(`[Recovery Service] Config: ${JSON.stringify(finalConfig)}`);

  // Main recovery loop
  recoveryInterval = setInterval(async () => {
    if (!isDegradationModeActive()) {
      return; // Not in degradation mode, nothing to do
    }

    try {
      const dbAvailable = await isDatabaseAvailable();

      if (dbAvailable) {
        console.log('[Recovery Service] Database recovered! Attempting to process queued transactions...');
        await attemptRecovery();
      }
    } catch (error) {
      console.error('[Recovery Service] Recovery check failed:', error);
    }
  }, finalConfig.checkInterval);

  // Status logging
  statusLoggingInterval = setInterval(() => {
    if (!isDegradationModeActive()) return;

    const stats = getQueueStats();
    console.log('[Recovery Service] Queue Status:', stats);
  }, 30000);

  console.log('[Recovery Service] Recovery service started');
}

/**
 * Stop the recovery service
 */
export function stopRecoveryService(): void {
  if (recoveryInterval) {
    clearInterval(recoveryInterval);
    recoveryInterval = null;
  }

  if (statusLoggingInterval) {
    clearInterval(statusLoggingInterval);
    statusLoggingInterval = null;
  }

  console.log('[Recovery Service] Recovery service stopped');
}

/**
 * Attempt to recover and process queued transactions
 */
async function attemptRecovery(): Promise<void> {
  recoveryAttempts++;

  try {
    console.log(`[Recovery Service] Recovery attempt ${recoveryAttempts}...`);

    // Process FA transactions
    const faResult = await processQueuedFATransactions();
    console.log(`[Recovery Service] FA Transactions: ${faResult.processed} processed, ${faResult.failed} failed`);

    // Process trade approvals
    const tradeResult = await processQueuedTradeApprovals();
    console.log(`[Recovery Service] Trade Approvals: ${tradeResult.processed} processed, ${tradeResult.failed} failed`);

    // Check if all queued items were processed
    const stats = getQueueStats();
    if (stats.queued === 0) {
      console.log('[Recovery Service] All queued transactions processed! Exiting degradation mode.');
      exitDegradationMode();
      recoveryAttempts = 0;
    } else {
      console.log(`[Recovery Service] ${stats.queued} transactions still queued, will retry...`);
    }
  } catch (error) {
    console.error('[Recovery Service] Recovery attempt failed:', error);

    // Re-enter degradation mode if recovery fails
    if (isDegradationModeActive()) {
      console.warn('[Recovery Service] Recovery failed, remaining in degradation mode');
    }
  }
}

/**
 * Check if database is available
 */
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    // Try both FA and Trade database checks
    const faAvailable = await isFADbAvailable();
    const tradeAvailable = await isTradeDbAvailable();

    return faAvailable && tradeAvailable;
  } catch (error) {
    console.error('[Recovery Service] Database availability check failed:', error);
    return false;
  }
}

/**
 * Get recovery service status
 */
export function getRecoveryServiceStatus() {
  return {
    running: recoveryInterval !== null,
    recoveryAttempts,
    queueStats: getQueueStats()
  };
}

/**
 * Manually trigger recovery attempt
 */
export async function triggerManualRecovery(): Promise<void> {
  if (!isDegradationModeActive()) {
    console.warn('[Recovery Service] Not in degradation mode, nothing to recover');
    return;
  }

  console.log('[Recovery Service] Manual recovery triggered');
  await attemptRecovery();
}

/**
 * Force exit degradation mode (for testing/admin)
 */
export function forceExitDegradationMode(): void {
  console.warn('[Recovery Service] Force exiting degradation mode');
  exitDegradationMode();
  recoveryAttempts = 0;
}
