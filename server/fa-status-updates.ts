import { Client, TextChannel, Message } from 'discord.js';
import { getActiveBids, getCurrentBiddingWindow } from './fa-bid-parser';

const FA_CHANNEL_ID = '1095812920056762510';

let updateInterval: NodeJS.Timeout | null = null;
let lastStatusMessage: Message | null = null;

/**
 * Format status update message with all active bids
 */
async function formatStatusMessage(bids: Array<{ playerName: string; dropPlayer: string | null; team: string; bidAmount: number; bidderName: string }>, windowId: string, windowEndTime: Date): Promise<string> {
  if (bids.length === 0) {
    return `📊 **FA Bid Status Update**\n\n🏀 **Bidding Window:** ${windowId}\n\n_No active bids at this time._`;
  }
  
  // Sort by bid amount descending
  const sortedBids = [...bids].sort((a, b) => b.bidAmount - a.bidAmount);
  
  // Calculate coin commitments per bidder (only count highest bids per player)
  const { teamCoins } = await import('../drizzle/schema');
  const { getDb } = await import('./db');
  const { eq } = await import('drizzle-orm');
  const db = await getDb();
  
  // Group bids by player to find highest bidder for each
  const playerBids = new Map<string, Array<typeof bids[0]>>();
  for (const bid of bids) {
    if (!playerBids.has(bid.playerName)) {
      playerBids.set(bid.playerName, []);
    }
    playerBids.get(bid.playerName)!.push(bid);
  }
  
  // Find highest bid for each player
  const winningBids: Array<typeof bids[0]> = [];
  for (const [playerName, playerBidList] of Array.from(playerBids.entries())) {
    const highestBid = playerBidList.reduce((max: any, bid: any) => bid.bidAmount > max.bidAmount ? bid : max);
    winningBids.push(highestBid);
  }
  
  const bidderCommitments = new Map<string, { team: string; total: number; available: number }>();
  
  // Only count winning bids toward commitment
  for (const bid of winningBids) {
    if (!bidderCommitments.has(bid.bidderName)) {
      // Get team's available coins
      let available = 100; // default
      if (db) {
        const teamCoinData = await db.select().from(teamCoins).where(eq(teamCoins.team, bid.team)).limit(1);
        if (teamCoinData.length > 0) {
          available = teamCoinData[0].coinsRemaining;
        }
      }
      bidderCommitments.set(bid.bidderName, { team: bid.team, total: 0, available });
    }
    const commitment = bidderCommitments.get(bid.bidderName)!;
    commitment.total += bid.bidAmount;
  }
  
  // Calculate time remaining
  const now = new Date();
  const timeRemaining = windowEndTime.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  let countdownText = '';
  if (timeRemaining > 0) {
    if (hoursRemaining > 0) {
      countdownText = `${hoursRemaining}h ${minutesRemaining}m`;
    } else {
      countdownText = `${minutesRemaining}m`;
    }
  } else {
    countdownText = 'Window closed';
  }
  
  let message = `📊 **FA Bid Status Update**\n\n`;
  message += `🏀 **Bidding Window:** ${windowId}\n`;
  message += `⏰ **Last Updated:** ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true })} EST\n`;
  message += `⏳ **Window closes in:** ${countdownText}\n\n`;
  message += `🏆 **Active Bids (${bids.length} players)**\n\n`;
  
  for (const bid of sortedBids) {
    // Escape underscores to prevent markdown italics
    const escapedBidderName = bid.bidderName.replace(/_/g, '\\_');
    message += `**${bid.playerName}**\n`;
    message += `• Bid: $${bid.bidAmount}\n`;
    message += `• Leader: ${escapedBidderName} (${bid.team})`;
    if (bid.dropPlayer) {
      message += ` - cutting: ${bid.dropPlayer}`;
    }
    message += `\n---\n\n`;
  }
  
  message += `---\n\n`;
  message += `💰 **Coin Commitments**\n\n`;
  
  // Sort bidders by total commitment descending
  const sortedCommitments = Array.from(bidderCommitments.entries()).sort((a, b) => b[1].total - a[1].total);
  
  for (const [bidderName, commitment] of sortedCommitments) {
    // Escape underscores to prevent markdown italics
    const escapedBidderName = bidderName.replace(/_/g, '\\_');
    const remaining = commitment.available - commitment.total;
    message += `**${escapedBidderName}** (${commitment.team}): $${commitment.total} committed, $${remaining} remaining\n`;
  }
  
  message += `\n---\n`;
  message += `💡 **To place a bid, use format: "Cut [Player]. Sign [Player]. Bid [Amount]"**\n`;
  message += `⚡ **Admins: React with ⚡ to process winning bids**`;
  
  return message;
}

/**
 * Post status update message
 */
export async function postStatusUpdate(client: Client) {
  try {
    const window = getCurrentBiddingWindow();
    const bids = await getActiveBids(window.windowId);
    
    const channel = await client.channels.fetch(FA_CHANNEL_ID);
    if (!channel?.isTextBased()) {
      console.log('[FA Status] Channel is not text-based');
      return;
    }
    
    // Get previous status message ID from database
    const { bidWindows } = await import('../drizzle/schema');
    const { getDb } = await import('./db');
    const { eq, or, sql } = await import('drizzle-orm');
    const db = await getDb();
    
    if (db) {
      // Check for special window mode (before noon EST on 2025-11-15)
      const now = new Date();
      const noonEST = new Date('2025-11-15T12:00:00-05:00');
      const isSpecialWindow = now < noonEST;
      
      // Delete status messages from current window AND previous window if in special mode
      const windowsToCheck = isSpecialWindow 
        ? ['2025-11-14-PM', window.windowId]
        : [window.windowId];
      
      const windowRecords = await db
        .select()
        .from(bidWindows)
        .where(
          sql`${bidWindows.windowId} IN (${sql.join(windowsToCheck.map(w => sql`${w}`), sql`, `)})`
        );
      
      // Delete all previous status messages
      for (const record of windowRecords) {
        if (record.statusMessageId) {
          try {
            const previousMessage = await (channel as TextChannel).messages.fetch(record.statusMessageId);
            await previousMessage.delete();
            console.log(`[FA Status] Deleted previous status message from window ${record.windowId}`);
          } catch (error) {
            console.log(`[FA Status] Could not delete message from window ${record.windowId} (may already be deleted)`);
          }
        }
      }
    }
    
    const messageContent = await formatStatusMessage(bids, window.windowId, window.endTime);
    const newMessage = await (channel as TextChannel).send(messageContent);
    lastStatusMessage = newMessage;
    
    // Save new message ID to database
    if (db) {
      const windowRecord = await db.select().from(bidWindows).where(eq(bidWindows.windowId, window.windowId)).limit(1);
      
      if (windowRecord.length > 0) {
        // Update existing window
        await db.update(bidWindows)
          .set({ statusMessageId: newMessage.id })
          .where(eq(bidWindows.windowId, window.windowId));
      } else {
        // Create new window record
        await db.insert(bidWindows).values({
          windowId: window.windowId,
          startTime: new Date(window.startTime),
          endTime: new Date(window.endTime),
          status: window.isLocked ? 'locked' : 'active',
          statusMessageId: newMessage.id
        });
      }
    }
    
    console.log(`[FA Status] Posted status update: ${bids.length} active bids`);
  } catch (error) {
    console.error('[FA Status] Failed to post status update:', error);
  }
}

/**
 * Start status updates every 6 hours
 */
export function startHourlyUpdates(client: Client) {
  // Stop any existing updates first
  stopHourlyUpdates();
  
  // Post initial status message immediately
  postStatusUpdate(client);
  
  // Schedule updates every 6 hours
  const now = new Date();
  const msUntilNext6Hours = (6 * 60 - (now.getHours() % 6) * 60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
  
  console.log(`[FA Status] Next update in ${Math.round(msUntilNext6Hours / 1000 / 60)} minutes`);
  
  // Post new message at next 6-hour mark
  setTimeout(() => {
    postStatusUpdate(client);
    
    // Then post new message every 6 hours
    updateInterval = setInterval(() => {
      postStatusUpdate(client);
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  }, msUntilNext6Hours);
  
  console.log('[FA Status] Updates scheduled every 6 hours');
}

/**
 * Stop status updates
 */
export function stopHourlyUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('[FA Status] Status updates stopped');
  }
}
