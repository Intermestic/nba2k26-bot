import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { getActiveBids, getCurrentBiddingWindow } from './fa-bid-parser';
import { validateTeamName } from './team-validator';

const FA_CHANNEL_ID = '1095812920056762510';

// Mutex lock to prevent concurrent batch processing
const processingLocks = new Map<string, boolean>();

/**
 * Post window close summary with all winning bids
 */
export async function postWindowCloseSummary(client: Client, retryCount = 0) {
  const MAX_RETRIES = 3;
  
  try {
    const window = getCurrentBiddingWindow();
    
    // Only post if window is locked (at 11:50 AM/PM)
    if (!window.isLocked) {
      console.log('[Window Close] Window not yet locked, skipping summary');
      return;
    }
    
    console.log(`[Window Close] Fetching active bids for window ${window.windowId}...`);
    
    let bids;
    try {
      bids = await getActiveBids(window.windowId);
    } catch (dbError: any) {
      console.error('[Window Close] Database error fetching bids:', dbError?.message || dbError);
      
      // Retry on database errors
      if (retryCount < MAX_RETRIES) {
        const delayMs = (retryCount + 1) * 2000; // 2s, 4s, 6s
        console.log(`[Window Close] Retrying in ${delayMs}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return postWindowCloseSummary(client, retryCount + 1);
      }
      
      throw dbError;
    }
    
    if (bids.length === 0) {
      console.log('[Window Close] No bids to summarize');
      return;
    }
    
    console.log(`[Window Close] Found ${bids.length} winning bids, posting summary...`);
    
    const channel = await client.channels.fetch(FA_CHANNEL_ID);
    if (!channel?.isTextBased()) {
      console.log('[Window Close] Channel is not text-based');
      return;
    }
    
    // Sort bids by amount descending
    const sortedBids = [...bids].sort((a, b) => b.bidAmount - a.bidAmount);
    
    // Calculate total coins spent
    const totalCoins = sortedBids.reduce((sum, bid) => sum + bid.bidAmount, 0);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00) // Green
      .setTitle(`🏁 Bidding Window Closed: ${window.windowId}`)
      .setDescription(`**Winning Bids Summary**\n\nThe following ${bids.length} player${bids.length === 1 ? '' : 's'} received bids this window:`)
      .setTimestamp();
    
    // Add fields for each bid (max 25 fields per embed)
    const maxFields = Math.min(sortedBids.length, 25);
    for (let i = 0; i < maxFields; i++) {
      const bid = sortedBids[i];
      const dropInfo = bid.dropPlayer ? `Cut: ${bid.dropPlayer}\n` : '';
      embed.addFields({
        name: `${bid.playerName}`,
        value: `${dropInfo}Sign: ${bid.playerName}\n→ **${bid.team}** ($${bid.bidAmount})\nWinner: ${bid.bidderName}`,
        inline: true
      });
    }
    
    // Add total coins footer
    embed.setFooter({ text: `Total coins committed: $${totalCoins} | React with ⚡ to process bids` });
    
    await (channel as TextChannel).send({ 
      content: '@everyone',
      embeds: [embed] 
    });
    
    console.log(`[Window Close] ✅ Successfully posted summary: ${bids.length} winning bids, $${totalCoins} total`);
  } catch (error: any) {
    console.error('[Window Close] ❌ Failed to post summary:', error?.message || error);
    
    // Don't retry on Discord API errors (rate limits, permissions, etc.)
    if (error?.code && typeof error.code === 'number') {
      console.error('[Window Close] Discord API error, not retrying');
      return;
    }
    
    // Retry on other errors
    if (retryCount < MAX_RETRIES) {
      const delayMs = (retryCount + 1) * 2000;
      console.log(`[Window Close] Retrying in ${delayMs}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return postWindowCloseSummary(client, retryCount + 1);
    }
  }
}

/**
 * Schedule window close summaries
 * Posts at 11:50 AM and 11:50 PM EST
 */
export function scheduleWindowCloseSummaries(client: Client) {
  // Helper function to get current time in EST/EDT
  function getEasternTime(): Date {
    // Use Intl API for accurate timezone conversion (handles DST automatically)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(new Date());
    const dateObj: any = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        dateObj[part.type] = part.value;
      }
    });
    
    return new Date(
      `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`
    );
  }
  
  // Helper function to schedule next window close
  function scheduleNextWindowClose() {
    const now = new Date();
    const estNow = getEasternTime();
    
    const hour = estNow.getHours();
    const minute = estNow.getMinutes();
    
    // Calculate next 11:50 AM or 11:50 PM in EST
    let nextRunHour: number;
    if (hour < 11 || (hour === 11 && minute < 50)) {
      // Next run is today at 11:50 AM
      nextRunHour = 11;
    } else if (hour < 23 || (hour === 23 && minute < 50)) {
      // Next run is today at 11:50 PM
      nextRunHour = 23;
    } else {
      // Next run is tomorrow at 11:50 AM
      nextRunHour = 11 + 24; // Will handle day rollover below
    }
    
    // Create target time in EST
    const targetEST = new Date(estNow);
    if (nextRunHour >= 24) {
      targetEST.setDate(targetEST.getDate() + 1);
      targetEST.setHours(11, 50, 0, 0);
    } else {
      targetEST.setHours(nextRunHour, 50, 0, 0);
    }
    
    // Convert EST time to UTC for setTimeout
    // This is tricky - we need to find the UTC time that corresponds to our EST target
    const estString = targetEST.toISOString().slice(0, 19).replace('T', ' ');
    const targetUTC = new Date(targetEST.toLocaleString('en-US', { timeZone: 'UTC' }));
    
    // Calculate milliseconds until next run
    const msUntilNext = targetEST.getTime() - estNow.getTime();
    const minutesUntilNext = Math.round(msUntilNext / 1000 / 60);
    
    console.log(`[Window Close] Next summary in ${minutesUntilNext} minutes (${targetEST.toLocaleString('en-US', { hour12: true })} EST)`);
    
    // Schedule the next run
    setTimeout(() => {
      console.log('[Window Close] Executing scheduled window close summary...');
      postWindowCloseSummary(client);
      
      // Schedule the next one after this completes
      scheduleNextWindowClose();
    }, msUntilNext);
  }
  
  // Start the scheduling chain
  scheduleNextWindowClose();
  console.log('[Window Close] Window close summaries scheduled for 11:50 AM/PM EST');
}

/**
 * Parse winning bids from window close summary message
 */
function parseSummaryMessage(embed: any): Array<{ playerName: string; dropPlayer: string | null; team: string; bidAmount: number; bidderName: string }> {
  const bids: Array<{ playerName: string; dropPlayer: string | null; team: string; bidAmount: number; bidderName: string }> = [];
  
  if (!embed.fields) return bids;
  
  for (const field of embed.fields) {
    // Field name is player name (signed player)
    const playerName = field.name;
    
    // Try Format 1: "Cut: PlayerName\nSign: PlayerName\n→ **TeamName** ($Amount)\nWinner: Username"
    const cutMatch1 = field.value.match(/Cut:\s+(.+?)(?:\n|$)/);
    const teamMatch1 = field.value.match(/→\s+\*\*(.+?)\*\*\s+\(\$(\d+)\)/);
    const winnerMatch1 = field.value.match(/Winner:\s+(.+)/);
    
    if (teamMatch1 && winnerMatch1) {
      bids.push({
        playerName,
        dropPlayer: cutMatch1 ? cutMatch1[1].trim() : null,
        team: teamMatch1[1],
        bidAmount: parseInt(teamMatch1[2]),
        bidderName: winnerMatch1[1]
      });
      continue;
    }
    
    // Try Format 2: "Cut: X / Sign: Y - $Z - Team"
    const format2Match = field.value.match(/Cut:\s+(.+?)\s+\/\s+Sign:\s+(.+?)\s+-\s+\$(\d+)\s+-\s+(.+)/);
    if (format2Match) {
      bids.push({
        playerName,
        dropPlayer: format2Match[1].trim(),
        team: format2Match[4].trim(),
        bidAmount: parseInt(format2Match[3]),
        bidderName: 'Unknown' // Manual summaries don't include username
      });
      continue;
    }
  }
  
  return bids;
}

/**
 * Process all winning bids from a summary message
 */
export async function processBidsFromSummary(message: any, processorId: string) {
  // Lock key for this message
  const lockKey = `batch-${message.id}`;
  
  try {
    // Check if this message is already being processed
    if (processingLocks.get(lockKey)) {
      console.log(`[Batch Process] Already processing message ${message.id}, skipping duplicate request`);
      return {
        success: false,
        message: 'Batch processing already in progress for this message'
      };
    }
    
    // Acquire lock
    processingLocks.set(lockKey, true);
    console.log(`[Batch Process] Lock acquired for message ${message.id}`);
    console.log(`[Batch Process] Starting batch processing from summary message by user ${processorId}`);
    
    // Parse bids from the summary message embed
    if (!message.embeds || message.embeds.length === 0) {
      return {
        success: false,
        message: 'No embed found in message'
      };
    }
    
    const bidsToProcess = parseSummaryMessage(message.embeds[0]);
    
    if (bidsToProcess.length === 0) {
      return {
        success: false,
        message: 'No bids found in summary message'
      };
    }
    
    console.log(`[Batch Process] Found ${bidsToProcess.length} bids to process`);
    
    const { getDb } = await import('./db');
    const { players, faTransactions, teamCoins } = await import('../drizzle/schema');
    const { eq, sql } = await import('drizzle-orm');
    const { findPlayerByFuzzyName } = await import('./fa-bid-parser');
    const { isTeamOverCap } = await import('./cap-violation-alerts');
    
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database connection failed'
      };
    }
    
    // Pre-processing warnings (non-blocking)
    const warnings: string[] = [];
    
    // Check each team's roster size and coin balance for warnings
    const teamStats = new Map<string, { rosterSize: number; coins: number; totalOverall: number }>();
    
    for (const bid of bidsToProcess) {
      if (!teamStats.has(bid.team)) {
        // Get team roster
        const roster = await db.select().from(players).where(eq(players.team, bid.team));
        const coins = await db.select().from(teamCoins).where(eq(teamCoins.team, bid.team));
        const totalOverall = roster.reduce((sum, p) => sum + p.overall, 0);
        
        teamStats.set(bid.team, {
          rosterSize: roster.length,
          coins: coins[0]?.coinsRemaining || 100,
          totalOverall
        });
      }
      
      const stats = teamStats.get(bid.team)!;
      
      // Check roster size (warning only)
      const rosterSizeAfter = bid.dropPlayer ? stats.rosterSize : stats.rosterSize + 1;
      if (rosterSizeAfter > 14) {
        warnings.push(`⚠️ ${bid.team} would exceed 14 players after signing ${bid.playerName} (no drop specified)`);
      }
      
      // Check coin balance (warning only)
      if (stats.coins < bid.bidAmount) {
        warnings.push(`⚠️ ${bid.team} has insufficient coins ($${stats.coins} < $${bid.bidAmount} for ${bid.playerName})`);
      }
      
      // Check over-cap restriction (warning only)
      const isOverCap = await isTeamOverCap(bid.team);
      if (isOverCap) {
        const signPlayer = await findPlayerByFuzzyName(bid.playerName, undefined, true, 'fa_batch_validation');
        if (signPlayer && signPlayer.overall > 70) {
          warnings.push(`⚠️ ${bid.team} is over cap and cannot sign ${bid.playerName} (${signPlayer.overall} OVR > 70)`);
        }
      }
      
      // Update stats for next check
      stats.rosterSize = rosterSizeAfter;
      stats.coins -= bid.bidAmount;
    }
    
    // Check for duplicate player signings (warning only)
    const playerCounts = new Map<string, number>();
    for (const bid of bidsToProcess) {
      const count = playerCounts.get(bid.playerName.toLowerCase()) || 0;
      playerCounts.set(bid.playerName.toLowerCase(), count + 1);
    }
    
    Array.from(playerCounts.entries()).forEach(([player, count]) => {
      if (count > 1) {
        warnings.push(`⚠️ Duplicate signing detected: ${player} has ${count} bids`);
      }
    });
    
    console.log(`[Batch Process] Pre-processing complete: ${bidsToProcess.length} bids, ${warnings.length} warnings`);
    
    const results: Array<{
      playerName: string;
      team: string;
      bidAmount: number;
      dropPlayer?: string;
      success: boolean;
      error?: string;
    }> = [];
    
    // Generate batch ID for this processing run
    const batchId = `batch-${Date.now()}-${processorId.replace(/[^a-zA-Z0-9]/g, '')}`;
    console.log(`[Batch Process] Batch ID: ${batchId}`);
    console.log(`[Batch Process] Processing ${bidsToProcess.length} bids with partial failure handling`);
    
    // Process each bid (continue on individual failures)
    for (const bid of bidsToProcess) {
      try {
        console.log(`[Batch Process] Processing: ${bid.playerName} → ${bid.team} ($${bid.bidAmount})`);
        
        // Validate team name
        const validatedTeam = validateTeamName(bid.team);
        if (!validatedTeam) {
          results.push({
            playerName: bid.playerName,
            team: bid.team,
            bidAmount: bid.bidAmount,
            success: false,
            error: `Invalid team name: ${bid.team}`
          });
          continue;
        }
        
        // Find the player being signed
        const signPlayer = await findPlayerByFuzzyName(bid.playerName, undefined, true, 'fa_batch_process');
        if (!signPlayer) {
          results.push({
            playerName: bid.playerName,
            team: bid.team,
            bidAmount: bid.bidAmount,
            success: false,
            error: 'Player not found'
          });
          continue;
        }
        
        // Handle cut player
        let dropPlayerName = 'N/A';
        let dropPlayerId: string | null = null;
        
        if (bid.dropPlayer) {
          const dropPlayer = await findPlayerByFuzzyName(bid.dropPlayer, validatedTeam, false, 'fa_batch_process');
          if (dropPlayer) {
            dropPlayerName = dropPlayer.name;
            dropPlayerId = dropPlayer.id;
            
            // Move dropped player to Free Agents
            await db
              .update(players)
              .set({ team: 'Free Agents' })
              .where(eq(players.id, dropPlayer.id));
            console.log(`[Batch Process] Dropped ${dropPlayer.name} from ${validatedTeam}`);
          } else {
            console.log(`[Batch Process] Warning: Could not find dropped player ${bid.dropPlayer}`);
          }
        }
        
        // Store previous team for rollback
        const previousTeam = signPlayer.team || 'Free Agent';
        
        // Add signed player to roster
        await db
          .update(players)
          .set({ team: validatedTeam })
          .where(eq(players.id, signPlayer.id));
        console.log(`[Batch Process] Signed ${signPlayer.name} to ${validatedTeam} (from ${previousTeam})`);
        
        // Get team's current coins
        const teamCoinRecord = await db
          .select()
          .from(teamCoins)
          .where(eq(teamCoins.team, validatedTeam));
        
        const currentCoins = teamCoinRecord[0]?.coinsRemaining || 100;
        const coinsAfter = currentCoins - bid.bidAmount;
            // Update team coins
        await db
          .update(teamCoins)
          .set({ coinsRemaining: coinsAfter })
          .where(eq(teamCoins.team, validatedTeam));
        
        // Create transaction record
        await db.insert(faTransactions).values({
          team: validatedTeam,
          dropPlayer: dropPlayerName,
          signPlayer: signPlayer.name,
          signPlayerOvr: signPlayer.overall,
          bidAmount: bid.bidAmount,
          adminUser: processorId,
          coinsRemaining: coinsAfter,
          batchId: batchId,
          previousTeam: previousTeam,
          rolledBack: false
        });
        
        results.push({
          playerName: bid.playerName,
          team: bid.team,
          bidAmount: bid.bidAmount,
          dropPlayer: dropPlayerName,
          success: true
        });
        
      } catch (error) {
        console.error(`[Batch Process] Error processing ${bid.playerName}:`, error);
        results.push({
          playerName: bid.playerName,
          team: bid.team,
          bidAmount: bid.bidAmount,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`[Batch Process] Completed: ${successCount} success, ${failCount} failed`);
    
    // Trigger Discord cap status auto-update after successful FA batch processing
    if (successCount > 0) {
      try {
        const { autoUpdateDiscord } = await import('./discord.js');
        // Collect affected teams from successful results
        const affectedTeams = Array.from(new Set(
          results.filter(r => r.success).map(r => r.team)
        ));
        autoUpdateDiscord(affectedTeams).catch(err => 
          console.error('[Batch Process] Auto-update Discord failed:', err)
        );
      } catch (err) {
        console.error('[Batch Process] Failed to trigger Discord auto-update:', err);
      }
    }
    
    // Release lock
    processingLocks.delete(lockKey);
    console.log(`[Batch Process] Lock released for message ${message.id}`);
    
    return {
      success: true,
      results,
      successCount,
      failCount
    };
    
  } catch (error) {
    console.error('[Batch Process] Fatal error:', error);
    
    // Release lock on error
    processingLocks.delete(lockKey);
    console.log(`[Batch Process] Lock released for message ${message.id} (error path)`);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Rollback a batch of transactions
 */
export async function rollbackBatch(batchId: string, rollbackBy: string) {
  try {
    console.log(`[Rollback] Starting rollback for batch ${batchId} by ${rollbackBy}`);
    
    const { getDb } = await import('./db');
    const { players, faTransactions, teamCoins } = await import('../drizzle/schema');
    const { eq, and, sql } = await import('drizzle-orm');
    
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database connection failed'
      };
    }
    
    // Get all transactions in this batch that haven't been rolled back
    const transactions = await db
      .select()
      .from(faTransactions)
      .where(
        and(
          eq(faTransactions.batchId, batchId),
          eq(faTransactions.rolledBack, false)
        )
      );
    
    if (transactions.length === 0) {
      return {
        success: false,
        message: 'No transactions found for this batch or already rolled back'
      };
    }
    
    console.log(`[Rollback] Found ${transactions.length} transactions to rollback`);
    
    const results: Array<{
      transactionId: number;
      playerName: string;
      team: string;
      success: boolean;
      error?: string;
    }> = [];
    
    // Rollback each transaction
    for (const transaction of transactions) {
      try {
        console.log(`[Rollback] Rolling back: ${transaction.signPlayer} from ${transaction.team} to ${transaction.previousTeam}`);
        
        // Find the player (case-insensitive)
        const playerRecords = await db
          .select()
          .from(players)
          .where(sql`LOWER(${players.name}) = LOWER(${transaction.signPlayer})`);
        
        if (playerRecords.length === 0) {
          results.push({
            transactionId: transaction.id,
            playerName: transaction.signPlayer,
            team: transaction.team,
            success: false,
            error: 'Player not found'
          });
          continue;
        }
        
        const player = playerRecords[0];
        
        // Restore player to previous team
        await db
          .update(players)
          .set({ team: transaction.previousTeam })
          .where(eq(players.id, player.id));
        
        // Refund coins to team
        const teamCoinRecord = await db
          .select()
          .from(teamCoins)
          .where(eq(teamCoins.team, transaction.team));
        
        const currentCoins = teamCoinRecord[0]?.coinsRemaining || 0;
        const coinsAfter = currentCoins + transaction.bidAmount;
        
        await db
          .update(teamCoins)
          .set({ coinsRemaining: coinsAfter })
          .where(eq(teamCoins.team, transaction.team));
        
        // Mark transaction as rolled back
        await db
          .update(faTransactions)
          .set({
            rolledBack: true,
            rolledBackAt: new Date(),
            rolledBackBy: rollbackBy
          })
          .where(eq(faTransactions.id, transaction.id));
        
        results.push({
          transactionId: transaction.id,
          playerName: transaction.signPlayer,
          team: transaction.team,
          success: true
        });
        
        console.log(`[Rollback] Successfully rolled back transaction ${transaction.id}`);
        
      } catch (error) {
        console.error(`[Rollback] Error rolling back transaction ${transaction.id}:`, error);
        results.push({
          transactionId: transaction.id,
          playerName: transaction.signPlayer,
          team: transaction.team,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`[Rollback] Completed: ${successCount} success, ${failCount} failed`);
    
    return {
      success: true,
      results,
      successCount,
      failCount
    };
    
  } catch (error) {
    console.error('[Rollback] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Manually regenerate window close summary for a specific window
 * Useful for reposting summaries with updated format
 */
export async function regenerateWindowSummary(client: Client, windowId: string): Promise<{ success: boolean; message?: string; bidCount?: number }> {
  try {
    console.log(`[Regenerate Summary] Starting for window ${windowId}`);
    
    const bids = await getActiveBids(windowId);
    
    if (bids.length === 0) {
      return {
        success: false,
        message: `No active bids found for window ${windowId}`
      };
    }
    
    const channel = await client.channels.fetch(FA_CHANNEL_ID);
    if (!channel?.isTextBased()) {
      return {
        success: false,
        message: 'FA channel is not text-based'
      };
    }
    
    // Sort bids by amount descending
    const sortedBids = [...bids].sort((a, b) => b.bidAmount - a.bidAmount);
    
    // Calculate total coins spent
    const totalCoins = sortedBids.reduce((sum, bid) => sum + bid.bidAmount, 0);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00) // Green
      .setTitle(`🏁 Bidding Window Closed: ${windowId}`)
      .setDescription(`**Winning Bids Summary (Regenerated)**\n\nThe following ${bids.length} player${bids.length === 1 ? '' : 's'} received bids this window:`)
      .setTimestamp();
    
    // Add fields for each bid (max 25 fields per embed)
    const maxFields = Math.min(sortedBids.length, 25);
    for (let i = 0; i < maxFields; i++) {
      const bid = sortedBids[i];
      const dropInfo = bid.dropPlayer ? `Cut: ${bid.dropPlayer}\n` : '';
      embed.addFields({
        name: `${bid.playerName}`,
        value: `${dropInfo}Sign: ${bid.playerName}\n→ **${bid.team}** ($${bid.bidAmount})\nWinner: ${bid.bidderName}`,
        inline: true
      });
    }
    
    // Add total coins footer
    embed.setFooter({ text: `Total coins committed: $${totalCoins} | React with ⚡ to process bids` });
    
    await (channel as TextChannel).send({ 
      content: '@everyone',
      embeds: [embed] 
    });
    
    console.log(`[Regenerate Summary] Posted summary: ${bids.length} winning bids, $${totalCoins} total`);
    
    return {
      success: true,
      bidCount: bids.length
    };
  } catch (error) {
    console.error('[Regenerate Summary] Failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate preview of batch processing without executing
 * Returns validation results and summary of changes
 */
export async function generateBatchPreview(message: any): Promise<{
  success: boolean;
  message?: string;
  errors?: string[];
  warnings?: string[];
  bidCount?: number;
  cuts?: string[];
  signs?: string[];
  teamSummaries?: string[];
  totalCoins?: number;
}> {
  try {
    // Parse bids from the summary message embed
    if (!message.embeds || message.embeds.length === 0) {
      return {
        success: false,
        message: 'No embed found in message'
      };
    }
    
    const bidsToProcess = parseSummaryMessage(message.embeds[0]);
    
    if (bidsToProcess.length === 0) {
      return {
        success: false,
        message: 'No bids found in summary message'
      };
    }
    
    const { getDb } = await import('./db');
    const { players, teamCoins } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const { findPlayerByFuzzyName } = await import('./fa-bid-parser');
    const { isTeamOverCap } = await import('./cap-violation-alerts');
    
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database connection failed'
      };
    }
    
    // Group transactions by team
    const teamTransactions = new Map<string, Array<{cut?: string; sign: string; coins: number}>>();
    let totalCoins = 0;
    
    for (const bid of bidsToProcess) {
      if (!teamTransactions.has(bid.team)) {
        teamTransactions.set(bid.team, []);
      }
      
      teamTransactions.get(bid.team)!.push({
        cut: bid.dropPlayer || undefined,
        sign: bid.playerName,
        coins: bid.bidAmount
      });
      
      totalCoins += bid.bidAmount;
    }
    
    // Build grouped preview lists
    const teamSummaries: string[] = [];
    const sortedTeams = Array.from(teamTransactions.keys()).sort();
    
    for (const team of sortedTeams) {
      const transactions = teamTransactions.get(team)!;
      const teamCoins = transactions.reduce((sum, t) => sum + t.coins, 0);
      
      const transactionDetails = transactions.map(t => {
        if (t.cut) {
          return `Cut ${t.cut}, Sign ${t.sign} ($${t.coins})`;
        } else {
          return `Sign ${t.sign} ($${t.coins})`;
        }
      }).join('; ');
      
      teamSummaries.push(`**${team}** ($${teamCoins}): ${transactionDetails}`);
    }
    
    return {
      success: true,
      bidCount: bidsToProcess.length,
      teamSummaries,
      totalCoins
    };
    
  } catch (error) {
    console.error('[Batch Preview] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
