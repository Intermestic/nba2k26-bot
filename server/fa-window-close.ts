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
