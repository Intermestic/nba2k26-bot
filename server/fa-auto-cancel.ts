import { getDb } from './db';
import { faBids, teamCoins } from '../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentBiddingWindow } from './fa-bid-parser';

/**
 * Auto-cancel oldest bids when a team exceeds their coin budget
 * Returns list of cancelled bids for notification purposes
 */
export async function autoCancelOverBudgetBids(
  team: string,
  windowId: string
): Promise<Array<{ playerName: string; bidAmount: number; bidderDiscordId: string; bidderName: string }>> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    // Get team's coin budget
    const teamCoinData = await db
      .select()
      .from(teamCoins)
      .where(eq(teamCoins.team, team))
      .limit(1);
    
    if (teamCoinData.length === 0) {
      console.log(`[FA Auto-Cancel] Team ${team} not found, using default 100 coins`);
      return [];
    }
    
    const budget = teamCoinData[0].coinsRemaining;
    
    // Get all bids for this team in current window
    const allTeamBids = await db
      .select()
      .from(faBids)
      .where(
        and(
          eq(faBids.team, team),
          eq(faBids.windowId, windowId)
        )
      )
      .orderBy(sql`${faBids.createdAt} ASC`); // Oldest first
    
    // Group by player to find highest bids
    const highestBidsByPlayer = new Map<string, typeof allTeamBids[0]>();
    
    for (const bid of allTeamBids) {
      const existing = highestBidsByPlayer.get(bid.playerName);
      if (!existing || bid.bidAmount > existing.bidAmount) {
        highestBidsByPlayer.set(bid.playerName, bid);
      }
    }
    
    // Calculate total commitment (only highest bids count)
    const winningBids = Array.from(highestBidsByPlayer.values());
    let totalCommitment = winningBids.reduce((sum, bid) => sum + bid.bidAmount, 0);
    
    console.log(`[FA Auto-Cancel] ${team} commitment: $${totalCommitment} / $${budget}`);
    
    if (totalCommitment <= budget) {
      // Under budget, no cancellations needed
      return [];
    }
    
    // Over budget - cancel oldest bids first
    const cancelledBids: Array<{ playerName: string; bidAmount: number; bidderDiscordId: string; bidderName: string }> = [];
    
    // Sort winning bids by creation time (oldest first)
    const sortedWinningBids = winningBids.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    for (const bid of sortedWinningBids) {
      if (totalCommitment <= budget) {
        break; // Back under budget
      }
      
      // Cancel this bid
      await db
        .delete(faBids)
        .where(eq(faBids.id, bid.id));
      
      totalCommitment -= bid.bidAmount;
      
      cancelledBids.push({
        playerName: bid.playerName,
        bidAmount: bid.bidAmount,
        bidderDiscordId: bid.bidderDiscordId,
        bidderName: bid.bidderName || 'Unknown'
      });
      
      console.log(`[FA Auto-Cancel] ❌ Cancelled: ${bid.bidderName}'s $${bid.bidAmount} bid on ${bid.playerName}`);
    }
    
    console.log(`[FA Auto-Cancel] ${team} now at: $${totalCommitment} / $${budget} (cancelled ${cancelledBids.length} bids)`);
    
    return cancelledBids;
  } catch (error) {
    console.error('[FA Auto-Cancel] Error:', error);
    return [];
  }
}

/**
 * Get next highest bidder after a bid is cancelled
 */
export async function getNextHighestBidder(
  playerName: string,
  windowId: string,
  excludeBidderId: string
): Promise<{ discordId: string; name: string; amount: number } | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Get all remaining bids for this player (excluding the cancelled bidder)
    const remainingBids = await db
      .select()
      .from(faBids)
      .where(
        and(
          eq(faBids.playerName, playerName),
          eq(faBids.windowId, windowId)
        )
      )
      .orderBy(sql`${faBids.bidAmount} DESC`);
    
    // Find highest bid that's not from the excluded bidder
    const nextBid = remainingBids.find(b => b.bidderDiscordId !== excludeBidderId);
    
    if (nextBid) {
      return {
        discordId: nextBid.bidderDiscordId,
        name: nextBid.bidderName || 'Unknown',
        amount: nextBid.bidAmount
      };
    }
    
    return null;
  } catch (error) {
    console.error('[FA Auto-Cancel] Error getting next bidder:', error);
    return null;
  }
}
