import { Client, TextChannel, Message } from 'discord.js';
import { getActiveBids, getCurrentBiddingWindow } from './fa-bid-parser';

const FA_CHANNEL_ID = '1095812920056762510';

let updateInterval: NodeJS.Timeout | null = null;

/**
 * Format status update message with all active bids
 */
function formatStatusMessage(bids: Array<{ playerName: string; team: string; bidAmount: number; bidderName: string }>, windowId: string): string {
  if (bids.length === 0) {
    return `📊 **FA Bid Status Update**\n\n🏀 **Bidding Window:** ${windowId}\n\n_No active bids at this time._`;
  }
  
  // Sort by bid amount descending
  const sortedBids = [...bids].sort((a, b) => b.bidAmount - a.bidAmount);
  
  let message = `📊 **FA Bid Status Update**\n\n`;
  message += `🏀 **Bidding Window:** ${windowId}\n`;
  message += `⏰ **Last Updated:** ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true })} EST\n\n`;
  message += `🏆 **Active Bids (${bids.length} players)**\n\n`;
  
  for (const bid of sortedBids) {
    message += `**${bid.playerName}**\n`;
    message += `├ Bid: $${bid.bidAmount}\n`;
    message += `└ Leader: ${bid.bidderName} (${bid.team})\n\n`;
  }
  
  message += `---\n`;
  message += `💡 *To place a bid, use format: "Cut [Player]. Sign [Player]. Bid [Amount]"*\n`;
  message += `⚡ *Admins: React with ⚡ to process winning bids*`;
  
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
    
    const messageContent = formatStatusMessage(bids, window.windowId);
    await (channel as TextChannel).send(messageContent);
    
    console.log(`[FA Status] Posted status update: ${bids.length} active bids`);
  } catch (error) {
    console.error('[FA Status] Failed to post status update:', error);
  }
}

/**
 * Start hourly status updates
 */
export function startHourlyUpdates(client: Client) {
  if (updateInterval) {
    console.log('[FA Status] Hourly updates already running');
    return;
  }
  
  // Post initial status message immediately
  postStatusUpdate(client);
  
  // Schedule hourly updates at the top of each hour
  const now = new Date();
  const msUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
  
  console.log(`[FA Status] Next update in ${Math.round(msUntilNextHour / 1000 / 60)} minutes`);
  
  // Post new message at next hour
  setTimeout(() => {
    postStatusUpdate(client);
    
    // Then post new message every hour
    updateInterval = setInterval(() => {
      postStatusUpdate(client);
    }, 60 * 60 * 1000); // Every hour
  }, msUntilNextHour);
  
  console.log('[FA Status] Hourly updates scheduled');
}

/**
 * Stop hourly status updates
 */
export function stopHourlyUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('[FA Status] Hourly updates stopped');
  }
}
