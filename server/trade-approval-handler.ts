import type { Message } from 'discord.js';
import { getDb } from './db';
import { trades, players } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { validateTeamName } from './team-validator';
import { findPlayerByFuzzyName } from './trade-parser';

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
  
  // First check if this trade was already processed (players already moved)
  try {
    const existingTrade = await db.select().from(trades).where(eq(trades.messageId, message.id)).limit(1);
    if (existingTrade.length > 0 && existingTrade[0].playersMovedAt) {
      console.log(`[Trade Approval] ⚠️ Trade ${message.id} was already processed on ${existingTrade[0].playersMovedAt}, skipping to prevent duplicate processing`);
      return;
    }
  } catch (checkError) {
    console.log(`[Trade Approval] Could not check if trade was already processed:`, checkError);
    // Continue anyway - better to process than to skip
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
      console.log('[Trade Approval] No direct trade record found, checking if this is the original trade message...');
      
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
                console.log(`[Trade Approval] Found trade record in reply message ${msgId}`);
                tradeRecords = replyTradeRecords;
                break;
              }
            }
          }
        }
      } catch (fetchError) {
        console.error('[Trade Approval] Error fetching related messages:', fetchError);
      }
    }
    
    // If no trade record found, try parsing directly from the message
    if (tradeRecords.length === 0) {
      console.log('[Trade Approval] No trade record found, attempting to parse directly from message...');
      const { parseTradeFromMessage } = await import('./simple-trade-parser');
      const parsedTrade = await parseTradeFromMessage(message);
      
      if (!parsedTrade) {
        console.log('[Trade Approval] Could not parse trade from message');
        await message.reply('❌ Could not parse trade details from this message.');
        return;
      }
      
      // Check if this is a multi-team trade (3+ teams)
      const isMultiTeamTrade = parsedTrade.teams && parsedTrade.teams.length > 2;
      
      if (isMultiTeamTrade) {
        console.log(`[Trade Approval] Processing ${parsedTrade.teams.length}-team trade`);
        
        // Validate all team names
        const validatedTeams = parsedTrade.teams.map(t => ({
          original: t.name,
          validated: validateTeamName(t.name),
          players: t.players
        }));
        
        const invalidTeams = validatedTeams.filter(t => !t.validated);
        if (invalidTeams.length > 0) {
          await message.reply(`❌ Invalid team names: ${invalidTeams.map(t => t.original).join(', ')}`);
          return;
        }
        
        const updatedPlayers: string[] = [];
        const notFoundPlayers: string[] = [];
        
        // In a multi-team trade, each team sends their players away
        // We need to determine where each player goes based on the trade structure
        // For now, we'll use a round-robin approach: Team1 players → Team2, Team2 players → Team3, Team3 players → Team1
        for (let i = 0; i < validatedTeams.length; i++) {
          const sendingTeam = validatedTeams[i];
          const receivingTeam = validatedTeams[(i + 1) % validatedTeams.length]; // Round-robin
          
          for (const player of sendingTeam.players) {
            const foundPlayer = await findPlayerByFuzzyName(player.name, sendingTeam.validated!, 'trade_approval');
            if (!foundPlayer) {
              notFoundPlayers.push(player.name);
              continue;
            }
            await db.update(players).set({ team: receivingTeam.validated! }).where(eq(players.id, foundPlayer.id));
            updatedPlayers.push(`${foundPlayer.name} (${sendingTeam.validated}) → ${receivingTeam.validated}`);
          }
        }
        
        let successMessage = `✅ **${parsedTrade.teams.length}-Team Trade Processed Successfully!**\n\n`;
        
        // Show what each team received
        for (let i = 0; i < validatedTeams.length; i++) {
          const receivingTeam = validatedTeams[i];
          const sendingTeam = validatedTeams[(i - 1 + validatedTeams.length) % validatedTeams.length]; // Previous team in round-robin
          
          successMessage += `**${receivingTeam.validated}** received:\n`;
          successMessage += sendingTeam.players.map(p => `• ${p.name} (${p.overall} OVR)`).join('\n');
          successMessage += '\n\n';
        }
        
        if (notFoundPlayers.length > 0) {
          successMessage += `⚠️ **Warning:** Could not find these players in database:\n`;
          successMessage += notFoundPlayers.map(p => `• ${p}`).join('\n');
        }
        
        await message.reply(successMessage);
        console.log(`[Trade Approval] ${parsedTrade.teams.length}-team trade processed successfully: ${updatedPlayers.length} players updated`);
      } else {
        // 2-team trade (legacy path)
        console.log(`[Trade Approval] Successfully parsed trade directly: ${parsedTrade.team1} ↔ ${parsedTrade.team2}`);
        
        // Execute the trade swap
        const validTeam1 = validateTeamName(parsedTrade.team1!);
        const validTeam2 = validateTeamName(parsedTrade.team2!);
        
        if (!validTeam1 || !validTeam2) {
          await message.reply(`❌ Invalid team names: ${parsedTrade.team1}, ${parsedTrade.team2}`);
          return;
        }
        
        const updatedPlayers: string[] = [];
        const notFoundPlayers: string[] = [];
        
        // Team1 receives Team2's players
        for (const player of parsedTrade.team2Players!) {
          const foundPlayer = await findPlayerByFuzzyName(player.name, validTeam2, 'trade_approval');
          if (!foundPlayer) {
            notFoundPlayers.push(player.name);
            continue;
          }
          await db.update(players).set({ team: validTeam1 }).where(eq(players.id, foundPlayer.id));
          updatedPlayers.push(`${foundPlayer.name} → ${validTeam1}`);
        }
        
        // Team2 receives Team1's players
        for (const player of parsedTrade.team1Players!) {
          const foundPlayer = await findPlayerByFuzzyName(player.name, validTeam1, 'trade_approval');
          if (!foundPlayer) {
            notFoundPlayers.push(player.name);
            continue;
          }
          await db.update(players).set({ team: validTeam2 }).where(eq(players.id, foundPlayer.id));
          updatedPlayers.push(`${foundPlayer.name} → ${validTeam2}`);
        }
        
        let successMessage = `✅ **Trade Processed Successfully!**\n\n`;
        successMessage += `**${validTeam1}** received:\n`;
        successMessage += parsedTrade.team2Players!.map(p => `• ${p.name} (${p.overall} OVR)`).join('\n');
        successMessage += `\n\n**${validTeam2}** received:\n`;
        successMessage += parsedTrade.team1Players!.map(p => `• ${p.name} (${p.overall} OVR)`).join('\n');
        
        if (notFoundPlayers.length > 0) {
          successMessage += `\n\n⚠️ **Warning:** Could not find these players in database:\n`;
          successMessage += notFoundPlayers.map(p => `• ${p}`).join('\n');
        }
        
        await message.reply(successMessage);
        console.log(`[Trade Approval] Trade processed successfully: ${updatedPlayers.length} players updated`);
      }
      
      // Try to mark as processed in database if trade record exists
      try {
        const existingTrade = await db.select().from(trades).where(eq(trades.messageId, message.id)).limit(1);
        if (existingTrade.length > 0) {
          await db
            .update(trades)
            .set({ playersMovedAt: new Date() })
            .where(eq(trades.messageId, message.id));
          console.log(`[Trade Approval] Marked trade ${message.id} as processed (playersMovedAt set)`);
        }
      } catch (updateError) {
        console.log(`[Trade Approval] Could not mark trade as processed (no record exists):`, updateError);
      }
      
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
    
    // Validate that both teams have players
    if (team1Players.length === 0 || team2Players.length === 0) {
      console.error(`[Trade Approval] Trade has empty player lists - Team1: ${team1Players.length}, Team2: ${team2Players.length}`);
      await message.reply('❌ Cannot process trade: One or both teams have no players listed. This may be a parsing error. Please check the original trade message format.');
      return;
    }
    
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
      // Skip placeholder entries
      if (!player.name || player.name === '--' || player.name.trim() === '') {
        console.log(`[Trade Approval] Skipping placeholder entry: "${player.name}"`);
        continue;
      }
      
      // Use fuzzy matching to find player
      const foundPlayer = await findPlayerByFuzzyName(player.name, validTeam2, 'trade_approval');
      
      if (!foundPlayer) {
        notFoundPlayers.push(player.name);
        continue;
      }
      
      await db
        .update(players)
        .set({ team: validTeam1 })
        .where(eq(players.id, foundPlayer.id));
      
      updatedPlayers.push(`${foundPlayer.name} → ${validTeam1}`);
    }
    
    // Team2 receives Team1's players
    for (const player of team1Players) {
      // Skip placeholder entries
      if (!player.name || player.name === '--' || player.name.trim() === '') {
        console.log(`[Trade Approval] Skipping placeholder entry: "${player.name}"`);
        continue;
      }
      
      // Use fuzzy matching to find player
      const foundPlayer = await findPlayerByFuzzyName(player.name, validTeam1, 'trade_approval');
      
      if (!foundPlayer) {
        notFoundPlayers.push(player.name);
        continue;
      }
      
      await db
        .update(players)
        .set({ team: validTeam2 })
        .where(eq(players.id, foundPlayer.id));
      
      updatedPlayers.push(`${foundPlayer.name} → ${validTeam2}`);
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
    
    // Mark trade as processed by setting playersMovedAt timestamp
    await db
      .update(trades)
      .set({ playersMovedAt: new Date() })
      .where(eq(trades.messageId, message.id));
    console.log(`[Trade Approval] Marked trade ${message.id} as processed (playersMovedAt set)`);
    
    // Update overcap roles AFTER posting success message (non-blocking)
    (async () => {
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
    })();
    
  } catch (error) {
    console.error('[Trade Approval] Error processing trade:', error);
    await message.reply('❌ An error occurred while processing the trade. Please check the logs.');
  }
}

/**
 * Process trade using data already saved in database
 * This is called after trade approval to avoid re-parsing the message
 */
export async function processTradeFromDatabase(message: Message, tradeRecord: any) {
  console.log(`[Trade Approval] Processing trade from database record for message ${message.id}`);
  
  const db = await getDb();
  if (!db) {
    console.error('[Trade Approval] Database not available');
    await message.reply('❌ Database connection failed. Cannot process trade.');
    return;
  }
  
  // Check if already processed
  if (tradeRecord.playersMovedAt) {
    console.log(`[Trade Approval] ⚠️ Trade ${message.id} was already processed on ${tradeRecord.playersMovedAt}, skipping`);
    return;
  }
  
  try {
    // Parse player data from JSON
    const team1Players = JSON.parse(tradeRecord.team1Players) as Array<{ name: string; overall: number; salary: number }>;
    const team2Players = JSON.parse(tradeRecord.team2Players) as Array<{ name: string; overall: number; salary: number }>;
    
    console.log(`[Trade Approval] Processing trade: ${tradeRecord.team1} ↔ ${tradeRecord.team2}`);
    console.log(`[Trade Approval] Team1 sends: ${team1Players.map(p => p.name).join(', ')}`);
    console.log(`[Trade Approval] Team2 sends: ${team2Players.map(p => p.name).join(', ')}`);
    
    // Validate that both teams have players
    if (team1Players.length === 0 || team2Players.length === 0) {
      console.error(`[Trade Approval] Trade has empty player lists - Team1: ${team1Players.length}, Team2: ${team2Players.length}`);
      await message.reply('❌ Cannot process trade: One or both teams have no players listed.');
      return;
    }
    
    // Normalize and validate team names
    const validTeam1 = validateTeamName(tradeRecord.team1);
    const validTeam2 = validateTeamName(tradeRecord.team2);
    
    if (!validTeam1 || !validTeam2) {
      console.error(`[Trade Approval] Invalid team names: ${tradeRecord.team1}, ${tradeRecord.team2}`);
      await message.reply(`❌ Invalid team names: ${tradeRecord.team1}, ${tradeRecord.team2}`);
      return;
    }
    
    // Find all players and update their teams
    const updatedPlayers: string[] = [];
    const notFoundPlayers: string[] = [];
    
    // Team1 receives Team2's players
    for (const player of team2Players) {
      if (!player.name || player.name === '--' || player.name.trim() === '') {
        continue;
      }
      
      const foundPlayer = await findPlayerByFuzzyName(player.name, validTeam2, 'trade_approval');
      if (!foundPlayer) {
        notFoundPlayers.push(player.name);
        continue;
      }
      
      await db.update(players).set({ team: validTeam1 }).where(eq(players.id, foundPlayer.id));
      updatedPlayers.push(`${foundPlayer.name} → ${validTeam1}`);
    }
    
    // Team2 receives Team1's players
    for (const player of team1Players) {
      if (!player.name || player.name === '--' || player.name.trim() === '') {
        continue;
      }
      
      const foundPlayer = await findPlayerByFuzzyName(player.name, validTeam1, 'trade_approval');
      if (!foundPlayer) {
        notFoundPlayers.push(player.name);
        continue;
      }
      
      await db.update(players).set({ team: validTeam2 }).where(eq(players.id, foundPlayer.id));
      updatedPlayers.push(`${foundPlayer.name} → ${validTeam2}`);
    }
    
    // Trigger story generation (non-blocking)
    (async () => {
      try {
        const storyPayload = {
          team1: validTeam1,
          team2: validTeam2,
          team1Players: team1Players.map(p => p.name),
          team2Players: team2Players.map(p => p.name),
        };
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${process.env.VITE_FRONTEND_FORGE_API_URL}/v1/chat/completions`, {
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
    
    // Mark trade as processed
    await db
      .update(trades)
      .set({ playersMovedAt: new Date() })
      .where(eq(trades.messageId, tradeRecord.messageId));
    console.log(`[Trade Approval] Marked trade ${tradeRecord.messageId} as processed`);
    
  } catch (error) {
    console.error('[Trade Approval] Error processing trade from database:', error);
    await message.reply('❌ An error occurred while processing the trade. Please check the logs.');
  }
}
