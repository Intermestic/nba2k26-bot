import type { Message } from 'discord.js';
import { getDb } from './db';
import { trades, players } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { validateTeamName } from './team-validator';

/**
 * Handle rewind emoji (⏪) reaction on processed trades
 * This reverses the trade and updates player teams back to original
 * OWNER ONLY - user ID 679275787664359435
 */
export async function handleTradeReversal(message: Message, userId: string) {
  console.log(`[Trade Reversal] Processing trade reversal from message ${message.id} by user ${userId}`);
  
  // Check if user is authorized (owner only)
  if (userId !== '679275787664359435') {
    console.log(`[Trade Reversal] Unauthorized user ${userId} attempted trade reversal`);
    await message.reply('❌ Only the league owner can reverse trades.');
    return;
  }
  
  const db = await getDb();
  if (!db) {
    console.error('[Trade Reversal] Database not available');
    await message.reply('❌ Database connection failed. Cannot reverse trade.');
    return;
  }
  
  try {
    // Look up the trade in the database
    // First try the current message ID
    let tradeRecords = await db
      .select()
      .from(trades)
      .where(eq(trades.messageId, message.id))
      .limit(1);
    
    // If not found, this might be the original trade message
    // Check if this message has any replies that might contain the trade record
    if (tradeRecords.length === 0) {
      console.log('[Trade Reversal] No direct trade record found, checking if this is the original trade message...');
      
      // Fetch the channel and look for approval messages that reference this message
      try {
        const channel = message.channel;
        if (channel.isTextBased()) {
          // Fetch recent messages to find approval replies
          const recentMessages = await channel.messages.fetch({ limit: 100 });
          
          // Look for messages that are replies to the current message
          for (const [msgId, msg] of Array.from(recentMessages.entries())) {
            if (msg.reference?.messageId === message.id) {
              // This is a reply to our trade message, check if it has a trade record
              const replyTradeRecords = await db
                .select()
                .from(trades)
                .where(eq(trades.messageId, msgId))
                .limit(1);
              
              if (replyTradeRecords.length > 0) {
                console.log(`[Trade Reversal] Found trade record in reply message ${msgId}`);
                tradeRecords = replyTradeRecords;
                break;
              }
            }
          }
        }
      } catch (fetchError) {
        console.error('[Trade Reversal] Error fetching related messages:', fetchError);
      }
    }
    
    if (tradeRecords.length === 0) {
      console.log('[Trade Reversal] No trade record found for this message or its replies');
      await message.reply('❌ No trade record found for this message.');
      return;
    }
    
    const trade = tradeRecords[0];
    
    // Check if trade was approved (can only reverse processed trades)
    if (trade.status !== 'approved') {
      console.log(`[Trade Reversal] Trade status is ${trade.status}, not approved/processed`);
      await message.reply(`❌ This trade was not processed yet. Current status: **${trade.status}**`);
      return;
    }
    
    // Parse player data from JSON
    const team1Players = JSON.parse(trade.team1Players) as Array<{ name: string; overall: number; salary: number }>;
    const team2Players = JSON.parse(trade.team2Players) as Array<{ name: string; overall: number; salary: number }>;
    
    console.log(`[Trade Reversal] Reversing trade: ${trade.team1} ↔ ${trade.team2}`);
    console.log(`[Trade Reversal] Team1 originally sent: ${team1Players.map(p => p.name).join(', ')}`);
    console.log(`[Trade Reversal] Team2 originally sent: ${team2Players.map(p => p.name).join(', ')}`);
    
    // Normalize and validate team names (handles aliases like "Cavs" → "Cavaliers")
    const validTeam1 = validateTeamName(trade.team1);
    const validTeam2 = validateTeamName(trade.team2);
    
    console.log(`[Trade Reversal] Normalized team names: ${validTeam1}, ${validTeam2}`);
    
    if (!validTeam1 || !validTeam2) {
      console.error(`[Trade Reversal] Invalid team names: ${trade.team1} → ${validTeam1 || 'INVALID'}, ${trade.team2} → ${validTeam2 || 'INVALID'}`);
      await message.reply(`❌ Invalid team names in trade record: ${trade.team1} (normalized: ${validTeam1 || 'not found'}), ${trade.team2} (normalized: ${validTeam2 || 'not found'})`);
      return;
    }
    
    // Reverse the player movements
    const reversedPlayers: string[] = [];
    const notFoundPlayers: string[] = [];
    
    // Team1's players go back to Team1 (they were sent to Team2)
    for (const player of team1Players) {
      const playerRecords = await db
        .select()
        .from(players)
        .where(sql`LOWER(${players.name}) = LOWER(${player.name})`)
        .limit(1);
      
      if (playerRecords.length === 0) {
        notFoundPlayers.push(player.name);
        continue;
      }
      
      await db
        .update(players)
        .set({ team: validTeam1 })
        .where(eq(players.id, playerRecords[0].id));
      
      reversedPlayers.push(`${player.name} → ${validTeam1}`);
    }
    
    // Team2's players go back to Team2 (they were sent to Team1)
    for (const player of team2Players) {
      const playerRecords = await db
        .select()
        .from(players)
        .where(sql`LOWER(${players.name}) = LOWER(${player.name})`)
        .limit(1);
      
      if (playerRecords.length === 0) {
        notFoundPlayers.push(player.name);
        continue;
      }
      
      await db
        .update(players)
        .set({ team: validTeam2 })
        .where(eq(players.id, playerRecords[0].id));
      
      reversedPlayers.push(`${player.name} → ${validTeam2}`);
    }
    
    // Update trade status to "reversed"
    await db
      .update(trades)
      .set({ 
        status: 'reversed',
        reversedBy: userId,
        reversedAt: new Date()
      })
      .where(eq(trades.id, trade.id));
    
    // Update overcap roles
    try {
      const { updateOvercapRoles } = await import('./overcap-roles');
      const { getDiscordClient } = await import('./discord-bot');
      const client = getDiscordClient();
      if (client) {
        await updateOvercapRoles(client);
        console.log('[Trade Reversal] Overcap roles updated after trade reversal');
      }
    } catch (error) {
      console.error('[Trade Reversal] Failed to update overcap roles:', error);
    }
    
    // Post success message
    let successMessage = `⏪ **Trade Reversed Successfully!**\n\n`;
    successMessage += `**${validTeam1}** got back:\n`;
    successMessage += team1Players.map(p => `• ${p.name} (${p.overall} OVR)`).join('\n');
    successMessage += `\n\n**${validTeam2}** got back:\n`;
    successMessage += team2Players.map(p => `• ${p.name} (${p.overall} OVR)`).join('\n');
    successMessage += `\n\n*Trade status updated to: reversed*`;
    
    if (notFoundPlayers.length > 0) {
      successMessage += `\n\n⚠️ **Warning:** Could not find these players in database:\n`;
      successMessage += notFoundPlayers.map(p => `• ${p}`).join('\n');
    }
    
    await message.reply(successMessage);
    console.log(`[Trade Reversal] Trade reversed successfully: ${reversedPlayers.length} players moved back`);
    
  } catch (error) {
    console.error('[Trade Reversal] Error reversing trade:', error);
    await message.reply('❌ An error occurred while reversing the trade. Please check the logs.');
  }
}
