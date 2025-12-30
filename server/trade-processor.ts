/**
 * Trade Processor with Graceful Degradation
 * 
 * Processes trade approvals with fallback to queue when database is unavailable.
 * Automatically retries queued trades when database recovers.
 */

import { Message } from 'discord.js';
import { getDb } from './db';
import { trades, players } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  isDegradationModeActive,
  enterDegradationMode,
  exitDegradationMode,
  queueTradeApproval,
  markTransactionFailed,
  markTransactionCompleted,
  getQueuedTransactionsByStatus,
  formatQueueStatus,
  QueuedTradeApproval
} from './graceful-degradation';

export interface TradeProcessingResult {
  success: boolean;
  message: string;
  queued?: boolean;
  transactionId?: string;
}

/**
 * Process a trade approval with graceful degradation
 */
export async function processTradeApproval(
  messageId: string,
  team1: string,
  team2: string,
  userId: string,
  discordMessage?: Message
): Promise<TradeProcessingResult> {
  try {
    const db = await getDb();

    // If DB is unavailable, queue the trade
    if (!db) {
      if (!isDegradationModeActive()) {
        enterDegradationMode();
        if (discordMessage) {
          try {
            await discordMessage.reply(formatQueueStatus());
          } catch (e) {
            console.error('[Trade Processor] Failed to send degradation status:', e);
          }
        }
      }

      const queued = queueTradeApproval(messageId, team1, team2, userId);
      return {
        success: true,
        message: `✅ **Queued**: Trade queued (${queued.id}). Will be processed when database recovers.`,
        queued: true,
        transactionId: queued.id
      };
    }

    // Process trade normally
    return await processTradeDirectly(messageId, team1, team2, userId, db);
  } catch (error: any) {
    console.error('[Trade Processor] Error processing trade:', error);

    // If error is database-related, enter degradation mode
    if (isDatabaseError(error)) {
      if (!isDegradationModeActive()) {
        enterDegradationMode();
      }

      const queued = queueTradeApproval(messageId, team1, team2, userId);
      return {
        success: true,
        message: `⚠️ **Queued**: Database temporarily unavailable. Trade queued (${queued.id}).`,
        queued: true,
        transactionId: queued.id
      };
    }

    return {
      success: false,
      message: `❌ **Error**: ${error.message || 'Failed to process trade'}`
    };
  }
}

/**
 * Process trade directly against database
 */
async function processTradeDirectly(
  messageId: string,
  team1: string,
  team2: string,
  userId: string,
  db: any
): Promise<TradeProcessingResult> {
  try {
    // Check if trade record exists
    const tradeRecord = await db
      .select()
      .from(trades)
      .where(eq(trades.messageId, messageId))
      .limit(1);

    if (tradeRecord.length === 0) {
      return {
        success: false,
        message: `❌ **Trade Not Found**: No trade record found for message ${messageId}`
      };
    }

    const trade = tradeRecord[0];

    // Check if already processed
    if (trade.playersMovedAt) {
      return {
        success: false,
        message: `⚠️ **Already Processed**: This trade was already processed on ${trade.playersMovedAt}`
      };
    }

    // Update trade status to approved
    await db
      .update(trades)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userId,
        playersMovedAt: new Date()
      })
      .where(eq(trades.id, trade.id));

    return {
      success: true,
      message: `✅ **Trade Approved**: Trade between ${team1} and ${team2} has been approved and processed.`
    };
  } catch (error: any) {
    console.error('[Trade Processor] Direct processing failed:', error);
    throw error;
  }
}

/**
 * Process all queued trade approvals
 */
export async function processQueuedTradeApprovals(): Promise<{ processed: number; failed: number }> {
  const queued = getQueuedTransactionsByStatus('queued').filter(
    t => t.type === 'trade-approval'
  ) as QueuedTradeApproval[];

  let processed = 0;
  let failed = 0;

  console.log(`[Trade Processor] Processing ${queued.length} queued trade approvals...`);

  for (const transaction of queued) {
    try {
      const result = await processTradeApproval(
        transaction.messageId,
        transaction.team1,
        transaction.team2,
        transaction.userId
      );

      if (result.success) {
        markTransactionCompleted(transaction.id);
        processed++;
      } else {
        markTransactionFailed(transaction.id, result.message);
        failed++;
      }
    } catch (error: any) {
      markTransactionFailed(transaction.id, error.message);
      failed++;

      // If we hit database errors again, exit recovery mode
      if (isDatabaseError(error)) {
        console.error('[Trade Processor] Database error during recovery, re-entering degradation mode');
        enterDegradationMode();
        break;
      }
    }
  }

  console.log(`[Trade Processor] Processed ${processed} trades, ${failed} failed`);
  return { processed, failed };
}

/**
 * Check if error is database-related
 */
function isDatabaseError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';

  return (
    message.includes('database') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT'
  );
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Try a simple query to verify connection
    const result = await db.execute('SELECT 1');
    return !!result;
  } catch (error) {
    console.error('[Trade Processor] Database availability check failed:', error);
    return false;
  }
}
