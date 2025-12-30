/**
 * FA Transaction Processor with Graceful Degradation
 * 
 * Processes FA transactions with fallback to queue when database is unavailable.
 * Automatically retries queued transactions when database recovers.
 */

import { Message } from 'discord.js';
import { getDb } from './db';
import { players, teamCoins, faTransactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  isDegradationModeActive,
  enterDegradationMode,
  exitDegradationMode,
  queueFATransaction,
  markTransactionFailed,
  markTransactionCompleted,
  getQueuedTransactionsByStatus,
  formatQueueStatus,
  QueuedFATransaction
} from './graceful-degradation';

export interface FATransactionResult {
  success: boolean;
  message: string;
  queued?: boolean;
  transactionId?: string;
}

/**
 * Process a single FA transaction with graceful degradation
 */
export async function processFATransaction(
  dropPlayer: string,
  signPlayer: string,
  bidAmount: number,
  team: string,
  userId: string,
  messageId: string,
  discordMessage?: Message
): Promise<FATransactionResult> {
  try {
    const db = await getDb();

    // If DB is unavailable, queue the transaction
    if (!db) {
      if (!isDegradationModeActive()) {
        enterDegradationMode();
        if (discordMessage) {
          try {
            await discordMessage.reply(formatQueueStatus());
          } catch (e) {
            console.error('[FA Processor] Failed to send degradation status:', e);
          }
        }
      }

      const queued = queueFATransaction(dropPlayer, signPlayer, bidAmount, team, userId, messageId);
      return {
        success: true,
        message: `✅ **Queued**: Transaction queued (${queued.id}). Will be processed when database recovers.`,
        queued: true,
        transactionId: queued.id
      };
    }

    // Process transaction normally
    return await processTransactionDirect(
      dropPlayer,
      signPlayer,
      bidAmount,
      team,
      userId,
      messageId,
      db
    );
  } catch (error: any) {
    console.error('[FA Processor] Error processing transaction:', error);

    // If error is database-related, enter degradation mode
    if (isDatabaseError(error)) {
      if (!isDegradationModeActive()) {
        enterDegradationMode();
      }

      const queued = queueFATransaction(dropPlayer, signPlayer, bidAmount, team, userId, messageId);
      return {
        success: true,
        message: `⚠️ **Queued**: Database temporarily unavailable. Transaction queued (${queued.id}).`,
        queued: true,
        transactionId: queued.id
      };
    }

    return {
      success: false,
      message: `❌ **Error**: ${error.message || 'Failed to process transaction'}`
    };
  }
}

/**
 * Process transaction directly against database
 */
async function processTransactionDirect(
  dropPlayer: string,
  signPlayer: string,
  bidAmount: number,
  team: string,
  userId: string,
  messageId: string,
  db: any
): Promise<FATransactionResult> {
  try {
    // Validate players exist
    const droppedPlayerRecord = await db
      .select()
      .from(players)
      .where(eq(players.name, dropPlayer))
      .limit(1);

    if (droppedPlayerRecord.length === 0) {
      return {
        success: false,
        message: `❌ **Player Not Found**: ${dropPlayer} not found in database`
      };
    }

    const signedPlayerRecord = await db
      .select()
      .from(players)
      .where(eq(players.name, signPlayer))
      .limit(1);

    if (signedPlayerRecord.length === 0) {
      return {
        success: false,
        message: `❌ **Player Not Found**: ${signPlayer} not found in database`
      };
    }

    // Check team coins
    const teamCoinsRecord = await db
      .select()
      .from(teamCoins)
      .where(eq(teamCoins.team, team))
      .limit(1);

    if (teamCoinsRecord.length === 0) {
      return {
        success: false,
        message: `❌ **Team Not Found**: ${team} not found in database`
      };
    }

    const coinsRemaining = teamCoinsRecord[0].coinsRemaining;
    if (coinsRemaining < bidAmount) {
      return {
        success: false,
        message: `❌ **Insufficient Coins**: ${team} has ${coinsRemaining} coins, need ${bidAmount}`
      };
    }

    // Update coins
    await db
      .update(teamCoins)
      .set({ coinsRemaining: coinsRemaining - bidAmount })
      .where(eq(teamCoins.team, team));

    // Move players
    await db
      .update(players)
      .set({ team: 'Free Agents' })
      .where(eq(players.id, droppedPlayerRecord[0].id));

    await db
      .update(players)
      .set({ team })
      .where(eq(players.id, signedPlayerRecord[0].id));

    // Log transaction
    await db.insert(faTransactions).values({
      team,
      dropPlayer,
      signPlayer,
      signPlayerOvr: signedPlayerRecord[0].overall,
      bidAmount,
      adminUser: userId,
      coinsRemaining: coinsRemaining - bidAmount
    });

    return {
      success: true,
      message: `✅ **Transaction Complete**: ${team} dropped ${dropPlayer}, signed ${signPlayer} (${bidAmount} coins, ${coinsRemaining - bidAmount} remaining)`
    };
  } catch (error: any) {
    console.error('[FA Processor] Direct processing failed:', error);
    throw error;
  }
}

/**
 * Process all queued FA transactions
 */
export async function processQueuedFATransactions(): Promise<{ processed: number; failed: number }> {
  const queued = getQueuedTransactionsByStatus('queued').filter(
    t => t.type === 'fa-transaction'
  ) as QueuedFATransaction[];

  let processed = 0;
  let failed = 0;

  console.log(`[FA Processor] Processing ${queued.length} queued FA transactions...`);

  for (const transaction of queued) {
    try {
      const result = await processFATransaction(
        transaction.dropPlayer,
        transaction.signPlayer,
        transaction.bidAmount,
        transaction.team,
        transaction.userId,
        transaction.messageId
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
        console.error('[FA Processor] Database error during recovery, re-entering degradation mode');
        enterDegradationMode();
        break;
      }
    }
  }

  console.log(`[FA Processor] Processed ${processed} transactions, ${failed} failed`);
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
    console.error('[FA Processor] Database availability check failed:', error);
    return false;
  }
}
