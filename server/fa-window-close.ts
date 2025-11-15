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
      embed.addFields({
        name: `${bid.playerName}`,
        value: `→ **${bid.team}** ($${bid.bidAmount})\nWinner: ${bid.bidderName}`,
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
function parseSummaryMessage(embed: any): Array<{ playerName: string; team: string; bidAmount: number; bidderName: string }> {
  const bids: Array<{ playerName: string; team: string; bidAmount: number; bidderName: string }> = [];
  
  if (!embed.fields) return bids;
  
  for (const field of embed.fields) {
    // Field name is player name
    const playerName = field.name;
    
    // Field value format: "→ **TeamName** ($Amount)\nWinner: Username"
    const teamMatch = field.value.match(/→\s+\*\*(.+?)\*\*\s+\(\$(\d+)\)/);
    const winnerMatch = field.value.match(/Winner:\s+(.+)/);
    
    if (teamMatch && winnerMatch) {
      bids.push({
        playerName,
        team: teamMatch[1],
        bidAmount: parseInt(teamMatch[2]),
        bidderName: winnerMatch[1]
      });
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
    const { eq } = await import('drizzle-orm');
    const { findPlayerByFuzzyName } = await import('./fa-bid-parser');
    
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database connection failed'
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
        
        let dropPlayerName = 'N/A';
        
        // Handle cut player - need to parse from bid message or use placeholder
        // For now, we'll require manual processing if dropPlayer info is needed
        // In the future, we can store dropPlayer in faBids table
        
        // Add signed player to roster
        await db
          .update(players)
          .set({ team: bid.team })
          .where(eq(players.id, signPlayer.id));
        console.log(`[Batch Process] Signed ${signPlayer.name} to ${bid.team}`);
        
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
          coinsRemaining: coinsAfter
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
