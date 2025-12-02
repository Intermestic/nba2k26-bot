import type { Message } from 'discord.js';
import { getDb } from './db';
import { trades, players } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { validateTeamName } from './team-validator';

/**
 * Handle bolt emoji (⚡) reaction on approved trades
 * This processes the trade and updates player teams
 */
export async function handleApprovedTradeProcessing(message: Message) {
  console.log(`[Trade Approval] Processing approved trade from message ${message.id}`);
  
  const db = await getDb();
  if (!db) {
    console.error('[Trade Approval] Database not available');
    await message.reply('❌ Database connection failed. Cannot process trade.');
    return;
  }
  
  try {
    // Look up the trade in the database
    const tradeRecords = await db
      .select()
      .from(trades)
      .where(eq(trades.messageId, message.id))
      .limit(1);
    
    if (tradeRecords.length === 0) {
      console.log('[Trade Approval] No trade record found for this message');
      await message.reply('❌ No trade record found for this message. The trade may not have been voted on yet.');
      return;
    }
    
    const trade = tradeRecords[0];
    
    // Check if trade is approved
    if (trade.status !== 'approved') {
      console.log(`[Trade Approval] Trade status is ${trade.status}, not approved`);
      await message.reply(`❌ This trade has not been approved yet. Current status: **${trade.status}**`);
      return;
    }
    
    // Parse player data from JSON
    const team1Players = JSON.parse(trade.team1Players) as Array<{ name: string; overall: number; salary: number }>;
    const team2Players = JSON.parse(trade.team2Players) as Array<{ name: string; overall: number; salary: number }>;
    
    console.log(`[Trade Approval] Processing trade: ${trade.team1} ↔ ${trade.team2}`);
    console.log(`[Trade Approval] Team1 sends: ${team1Players.map(p => p.name).join(', ')}`);
    console.log(`[Trade Approval] Team2 sends: ${team2Players.map(p => p.name).join(', ')}`);
    
    // Normalize and validate team names (handles aliases like "Cavs" → "Cavaliers")
    const validTeam1 = validateTeamName(trade.team1);
    const validTeam2 = validateTeamName(trade.team2);
    
    console.log(`[Trade Approval] Normalized team names: ${validTeam1}, ${validTeam2}`);
    
    if (!validTeam1 || !validTeam2) {
      console.error(`[Trade Approval] Invalid team names: ${trade.team1} → ${validTeam1 || 'INVALID'}, ${trade.team2} → ${validTeam2 || 'INVALID'}`);
      await message.reply(`❌ Invalid team names in trade record: ${trade.team1} (normalized: ${validTeam1 || 'not found'}), ${trade.team2} (normalized: ${validTeam2 || 'not found'})`);
      return;
    }
    
    // Find all players in database and update their teams
    const updatedPlayers: string[] = [];
    const notFoundPlayers: string[] = [];
    
    // Team1 receives Team2's players
    for (const player of team2Players) {
      const playerRecords = await db
        .select()
        .from(players)
        .where(eq(players.name, player.name))
        .limit(1);
      
      if (playerRecords.length === 0) {
        notFoundPlayers.push(player.name);
        continue;
      }
      
      await db
        .update(players)
        .set({ team: validTeam1 })
        .where(eq(players.id, playerRecords[0].id));
      
      updatedPlayers.push(`${player.name} → ${validTeam1}`);
    }
    
    // Team2 receives Team1's players
    for (const player of team1Players) {
      const playerRecords = await db
        .select()
        .from(players)
        .where(eq(players.name, player.name))
        .limit(1);
      
      if (playerRecords.length === 0) {
        notFoundPlayers.push(player.name);
        continue;
      }
      
      await db
        .update(players)
        .set({ team: validTeam2 })
        .where(eq(players.id, playerRecords[0].id));
      
      updatedPlayers.push(`${player.name} → ${validTeam2}`);
    }
    
    // Update overcap roles
    try {
      const { updateOvercapRoles } = await import('./overcap-roles');
      const { getDiscordClient } = await import('./discord-bot');
      const client = getDiscordClient();
      if (client) {
        await updateOvercapRoles(client);
        console.log('[Trade Approval] Overcap roles updated after trade');
      }
    } catch (error) {
      console.error('[Trade Approval] Failed to update overcap roles:', error);
    }
    
    // Check if trade involves 90+ OVR player → trigger story generation (non-blocking)
    const allPlayers = [...team1Players, ...team2Players];
    const hasStarPlayer = allPlayers.some(p => p.overall >= 90);
    
    if (hasStarPlayer) {
      // Fire and forget - don't wait for story generation to complete
      (async () => {
        try {
          console.log('[Trade Approval] Trade involves 90+ OVR player, triggering story generation...');
          
          const storyPayload = {
            type: 'trade',
            team1: trade.team1,
            team1Receives: team2Players.map(p => ({ name: p.name, overall: p.overall })),
            team2: trade.team2,
            team2Receives: team1Players.map(p => ({ name: p.name, overall: p.overall }))
          };
          
          // Call story generation API (with timeout to prevent hanging)
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch('https://hofsn-news.manus.space/api/generate-story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(storyPayload),
            signal: controller.signal
          });
          
          clearTimeout(timeout);
          
          if (response.ok) {
            console.log('[Trade Approval] Story generation triggered successfully');
          } else {
            console.error('[Trade Approval] Story generation failed:', response.statusText);
          }
        } catch (error) {
          console.error('[Trade Approval] Failed to trigger story generation:', error);
        }
      })();
    }
    
    // Post success message
    let successMessage = `✅ **Trade Processed Successfully!**\n\n`;
    successMessage += `**${validTeam1}** received:\n`;
    successMessage += team2Players.map(p => `• ${p.name} (${p.overall} OVR)`).join('\n');
    successMessage += `\n\n**${validTeam2}** received:\n`;
    successMessage += team1Players.map(p => `• ${p.name} (${p.overall} OVR)`).join('\n');
    
    if (notFoundPlayers.length > 0) {
      successMessage += `\n\n⚠️ **Warning:** Could not find these players in database:\n`;
      successMessage += notFoundPlayers.map(p => `• ${p}`).join('\n');
    }
    
    await message.reply(successMessage);
    console.log(`[Trade Approval] Trade processed successfully: ${updatedPlayers.length} players updated`);
    
  } catch (error) {
    console.error('[Trade Approval] Error processing trade:', error);
    await message.reply('❌ An error occurred while processing the trade. Please check the logs.');
  }
}
