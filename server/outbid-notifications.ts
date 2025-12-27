import type { Client } from 'discord.js';
import { getDb } from './db';
import { faBids, teamCoins } from '../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Check for outbid situations and send notifications
 * Called when a new bid is recorded
 */
export async function checkAndNotifyOutbid(
  client: Client,
  playerName: string,
  newBidderDiscordId: string,
  newBidAmount: number,
  windowId: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    
    // Get all bids for this player in this window, sorted by amount descending
    const allBids = await db
      .select()
      .from(faBids)
      .where(
        and(
          eq(faBids.playerName, playerName),
          eq(faBids.windowId, windowId)
        )
      )
      .orderBy(desc(faBids.bidAmount));
    
    if (allBids.length < 2) {
      // No previous bids to compare against
      return;
    }
    
    // Find the highest bid (should be the new one)
    const highestBid = allBids[0];
    
    // Find users who were outbid (had the previous highest bid)
    const previousHighestBid = allBids[1];
    
    // Only notify if someone else was the previous leader
    if (previousHighestBid.bidderDiscordId === newBidderDiscordId) {
      // Same person increased their bid, no notification needed
      return;
    }
    
    // Check if the previous bidder is now outbid
    if (previousHighestBid.bidAmount < highestBid.bidAmount) {
      // Get the outbid user's remaining coins
      const teamCoinData = await db
        .select()
        .from(teamCoins)
        .where(eq(teamCoins.team, previousHighestBid.team))
        .limit(1);
      
      const coinsRemaining = teamCoinData.length > 0 ? teamCoinData[0].coinsRemaining : 100;
      
      // Send DM to the outbid user
      try {
        const user = await client.users.fetch(previousHighestBid.bidderDiscordId);
        
        const dmMessage = `🚨 **You've been outbid!**\n\n` +
          `**Player:** ${playerName}\n` +
          `**Your bid:** $${previousHighestBid.bidAmount}\n` +
          `**New high bid:** $${highestBid.bidAmount}\n` +
          `**New leader:** ${highestBid.bidderName}\n\n` +
          `💰 **Your remaining coins:** $${coinsRemaining}\n\n` +
          `💡 **To counter-bid, use this format:**\n` +
          `\`Cut [Player]. Sign ${playerName}. Bid [Amount]\``;
        
        await user.send(dmMessage);
        console.log(`[Outbid Notification] Sent to ${previousHighestBid.bidderName} for ${playerName}`);
      } catch (error) {
        console.error(`[Outbid Notification] Failed to send DM to ${previousHighestBid.bidderName}:`, error);
      }
    }
  } catch (error) {
    console.error('[Outbid Notification] Error checking for outbids:', error);
  }
}
