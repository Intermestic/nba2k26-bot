import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { getActiveBids, getCurrentBiddingWindow } from './fa-bid-parser';

const FA_CHANNEL_ID = '1095812920056762510';

/**
 * Post window close summary with all winning bids
 */
export async function postWindowCloseSummary(client: Client) {
  try {
    const window = getCurrentBiddingWindow();
    
    // Only post if window is locked (at 11:50 AM/PM)
    if (!window.isLocked) {
      console.log('[Window Close] Window not yet locked, skipping summary');
      return;
    }
    
    const bids = await getActiveBids(window.windowId);
    
    if (bids.length === 0) {
      console.log('[Window Close] No bids to summarize');
      return;
    }
    
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
    
    console.log(`[Window Close] Posted summary: ${bids.length} winning bids, $${totalCoins} total`);
  } catch (error) {
    console.error('[Window Close] Failed to post summary:', error);
  }
}

/**
 * Schedule window close summaries
 * Posts at 11:50 AM and 11:50 PM EST
 */
export function scheduleWindowCloseSummaries(client: Client) {
  // Calculate time until next 11:50 AM or 11:50 PM EST
  const now = new Date();
  
  // Convert to EST (UTC-5)
  const estOffset = -5 * 60; // minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const estTime = new Date(utcTime + (estOffset * 60000));
  
  const hour = estTime.getHours();
  const minute = estTime.getMinutes();
  
  let nextSummaryTime = new Date(estTime);
  
  if (hour < 11 || (hour === 11 && minute < 50)) {
    // Next summary is today at 11:50 AM
    nextSummaryTime.setHours(11, 50, 0, 0);
  } else if (hour < 23 || (hour === 23 && minute < 50)) {
    // Next summary is today at 11:50 PM
    nextSummaryTime.setHours(23, 50, 0, 0);
  } else {
    // Next summary is tomorrow at 11:50 AM
    nextSummaryTime.setDate(nextSummaryTime.getDate() + 1);
    nextSummaryTime.setHours(11, 50, 0, 0);
  }
  
  const msUntilNextSummary = nextSummaryTime.getTime() - estTime.getTime();
  const minutesUntilNextSummary = Math.round(msUntilNextSummary / 1000 / 60);
  
  console.log(`[Window Close] Next summary in ${minutesUntilNextSummary} minutes (${nextSummaryTime.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST)`);
  
  // Schedule first summary
  setTimeout(() => {
    postWindowCloseSummary(client);
    
    // Schedule recurring summaries every 12 hours
    setInterval(() => {
      postWindowCloseSummary(client);
    }, 12 * 60 * 60 * 1000); // Every 12 hours
  }, msUntilNextSummary);
  
  console.log('[Window Close] Summaries scheduled for 11:50 AM/PM EST');
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
  try {
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
    
    // Pre-processing validation
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check each team's roster size and coin balance
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
      
      // Check roster size
      // If there's a dropPlayer, roster size stays the same (drop 1, add 1)
      // If no dropPlayer, roster size increases by 1
      const rosterSizeAfter = bid.dropPlayer ? stats.rosterSize : stats.rosterSize + 1;
      if (rosterSizeAfter > 14) {
        errors.push(`${bid.team} would exceed 14 players after signing ${bid.playerName} (no drop specified)`);
      }
      
      // Check coin balance
      if (stats.coins < bid.bidAmount) {
        errors.push(`${bid.team} has insufficient coins ($${stats.coins} < $${bid.bidAmount} for ${bid.playerName})`);
      }
      
      // Check over-cap restriction (teams over 1098 cannot sign 71+ OVR)
      const isOverCap = await isTeamOverCap(bid.team);
      if (isOverCap) {
        const signPlayer = await findPlayerByFuzzyName(bid.playerName);
        if (signPlayer && signPlayer.overall > 70) {
          errors.push(`${bid.team} is over cap and cannot sign ${bid.playerName} (${signPlayer.overall} OVR > 70)`);
        }
      }
      
      // Update stats for next check
      stats.rosterSize = rosterSizeAfter;
      stats.coins -= bid.bidAmount;
    }
    
    // Check for duplicate player signings
    const playerCounts = new Map<string, number>();
    for (const bid of bidsToProcess) {
      const count = playerCounts.get(bid.playerName.toLowerCase()) || 0;
      playerCounts.set(bid.playerName.toLowerCase(), count + 1);
    }
    
    Array.from(playerCounts.entries()).forEach(([player, count]) => {
      if (count > 1) {
        errors.push(`Duplicate signing detected: ${player} has ${count} bids`);
      }
    });
    
    // Return validation errors if any
    if (errors.length > 0) {
      return {
        success: false,
        message: 'Validation failed',
        errors,
        warnings
      };
    }
    
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
    
    // Process each bid
    for (const bid of bidsToProcess) {
      try {
        console.log(`[Batch Process] Processing: ${bid.playerName} → ${bid.team} ($${bid.bidAmount})`);
        
        // Find the player being signed
        const signPlayer = await findPlayerByFuzzyName(bid.playerName);
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
          const dropPlayer = await findPlayerByFuzzyName(bid.dropPlayer);
          if (dropPlayer) {
            dropPlayerName = dropPlayer.name;
            dropPlayerId = dropPlayer.id;
            
            // Move dropped player to Free Agents
            await db
              .update(players)
              .set({ team: 'Free Agents' })
              .where(eq(players.id, dropPlayer.id));
            console.log(`[Batch Process] Dropped ${dropPlayer.name} from ${bid.team}`);
          } else {
            console.log(`[Batch Process] Warning: Could not find dropped player ${bid.dropPlayer}`);
          }
        }
        
        // Store previous team for rollback
        const previousTeam = signPlayer.team || 'Free Agent';
        
        // Add signed player to roster
        await db
          .update(players)
          .set({ team: bid.team })
          .where(eq(players.id, signPlayer.id));
        console.log(`[Batch Process] Signed ${signPlayer.name} to ${bid.team} (from ${previousTeam})`);
        
        // Get team's current coins
        const teamCoinRecord = await db
          .select()
          .from(teamCoins)
          .where(eq(teamCoins.team, bid.team));
        
        const currentCoins = teamCoinRecord[0]?.coinsRemaining || 100;
        const coinsAfter = currentCoins - bid.bidAmount;
        
        // Deduct coins
        await db
          .update(teamCoins)
          .set({ coinsRemaining: coinsAfter })
          .where(eq(teamCoins.team, bid.team));
        
        // Create transaction record
        await db.insert(faTransactions).values({
          team: bid.team,
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
    
    return {
      success: true,
      results,
      successCount,
      failCount
    };
    
  } catch (error) {
    console.error('[Batch Process] Fatal error:', error);
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
    const { eq, and } = await import('drizzle-orm');
    
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
        
        // Find the player
        const playerRecords = await db
          .select()
          .from(players)
          .where(eq(players.name, transaction.signPlayer));
        
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
