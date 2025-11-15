import type { Message, ButtonInteraction } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { parseTrade, resolveTradePlayer } from './trade-parser';
import { getDb } from './db';
import { players } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { validateTeamName } from './team-validator';

/**
 * Handle trade message from trade channel
 */
export async function handleTradeMessage(message: Message) {
  console.log(`[Trade Handler] Received message in Trade channel (ID: ${message.id})`);
  
  // Note: We allow bot messages since trades are posted by a bot
  
  // Extract text from message content or embeds
  let messageText = message.content;
  
  // If message content is empty, try to extract from embeds
  if (!messageText || messageText.trim().length === 0) {
    if (message.embeds && message.embeds.length > 0) {
      const embed = message.embeds[0];
      
      // Try to extract from embed fields first (bot-posted trades)
      if (embed.fields && embed.fields.length >= 2) {
        console.log('[Trade Handler] Found embed fields:', embed.fields.length);
        
        // Look for fields with team names like "Knicks receives" or "Hornets receives"
        const field1 = embed.fields[0];
        const field2 = embed.fields[1];
        
        // Reconstruct trade text from fields
        messageText = `${field1.name}\n${field1.value}\n\n${field2.name}\n${field2.value}`;
        console.log('[Trade Handler] Extracted text from embed fields:', messageText);
      } else {
        // Fallback to description/title
        messageText = embed.description || embed.title || '';
        console.log('[Trade Handler] Extracted text from embed description/title:', messageText);
      }
    }
  }
  
  if (!messageText || messageText.trim().length === 0) {
    console.log('[Trade Handler] No text content found in message');
    await message.reply('❌ Could not find trade text in message.');
    return;
  }
  
  // Parse the trade
  const parsedTrade = parseTrade(messageText);
  if (!parsedTrade) {
    console.log(`[Trade Handler] Failed to parse trade from message`);
    await message.reply('❌ Could not parse trade. Please check the format and try again.');
    return;
  }
  
  console.log(`[Trade Handler] Parsed trade:`, parsedTrade);
  
  // Resolve all players
  const resolved = await resolveTradePlayer(parsedTrade);
  
  if (!resolved.valid) {
    console.log(`[Trade Handler] Trade validation failed:`, resolved.errors);
    await message.reply(`❌ **Trade Validation Failed**\n\n${resolved.errors.join('\n')}`);
    return;
  }
  
  // Create confirmation message
  // NOTE: Parser extracts "Team send" format, so team1Players = what team1 sends (team2 receives)
  // We need to swap for the confirmation message
  const team1ReceivesList = resolved.team2Players
    .map(p => `• ${p.name} (${p.overall} OVR)`)
    .join('\n');
  
  const team2ReceivesList = resolved.team1Players
    .map(p => `• ${p.name} (${p.overall} OVR)`)
    .join('\n');
  
  const confirmButton = new ButtonBuilder()
    .setCustomId('confirm_trade')
    .setLabel('✅ Confirm Trade')
    .setStyle(ButtonStyle.Success);
  
  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_trade')
    .setLabel('❌ Cancel')
    .setStyle(ButtonStyle.Danger);
  
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(confirmButton, cancelButton);
  
  // Check if channel is text-based
  if (!('send' in message.channel)) return;
  
  const confirmMessage = await message.channel.send({
    content: 
      `🤝 **Trade Confirmation**\n\n` +
      `**${resolved.team1} receives:**\n${team1ReceivesList}\n\n` +
      `**${resolved.team2} receives:**\n${team2ReceivesList}\n\n` +
      `Should I process this trade?`,
    components: [row]
  });
  
  // Handle button interactions
  const collector = confirmMessage.createMessageComponentCollector({
    time: 300000 // 5 minutes
  });
  
  collector.on('collect', async (interaction: ButtonInteraction) => {
    if (interaction.customId === 'confirm_trade') {
      await interaction.update({
        content: `⏳ Processing trade...`,
        components: []
      });
      
      const result = await processTrade(resolved);
      
      await interaction.editReply({
        content: result.success 
          ? `✅ **Trade Completed**\n\n${result.message}`
          : `❌ **Trade Failed**\n\n${result.message}`,
        components: []
      });
    } else if (interaction.customId === 'cancel_trade') {
      await interaction.update({
        content: `❌ Trade cancelled.`,
        components: []
      });
    }
  });
  
  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      await confirmMessage.edit({
        content: `⏱️ Trade confirmation timed out.`,
        components: []
      });
    }
  });
}

/**
 * Process approved trade
 */
async function processTrade(resolved: {
  team1: string;
  team1Players: Array<{ id: string; name: string; overall: number }>;
  team2: string;
  team2Players: Array<{ id: string; name: string; overall: number }>;
}): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database connection failed' };
  }
  
  try {
    // Validate team names
    const validTeam1 = validateTeamName(resolved.team1);
    const validTeam2 = validateTeamName(resolved.team2);
    
    if (!validTeam1 || !validTeam2) {
      return { 
        success: false, 
        message: `Invalid team names: ${!validTeam1 ? resolved.team1 : ''} ${!validTeam2 ? resolved.team2 : ''}` 
      };
    }
    
    // Update all players
    // Team 1 receives team 2's players
    for (const player of resolved.team2Players) {
      await db
        .update(players)
        .set({ team: validTeam1 })
        .where(eq(players.id, player.id));
    }
    
    // Team 2 receives team 1's players
    for (const player of resolved.team1Players) {
      await db
        .update(players)
        .set({ team: validTeam2 })
        .where(eq(players.id, player.id));
    }
    
    // Update overcap roles
    try {
      const { updateOvercapRoles } = await import('./overcap-roles');
      const { getDiscordClient } = await import('./discord-bot');
      const client = getDiscordClient();
      if (client) {
        await updateOvercapRoles(client);
        console.log('[Trade Handler] Overcap roles updated after trade');
      }
    } catch (error) {
      console.error('[Trade Handler] Failed to update overcap roles:', error);
    }
    
    // Check if trade involves 90+ OVR player → trigger story generation
    const allPlayers = [...resolved.team1Players, ...resolved.team2Players];
    const hasStarPlayer = allPlayers.some(p => p.overall >= 90);
    
    if (hasStarPlayer) {
      try {
        console.log('[Trade Handler] Trade involves 90+ OVR player, triggering story generation...');
        
        const storyPayload = {
          type: 'trade',
          team1: resolved.team1,
          team1Receives: resolved.team2Players.map(p => ({ name: p.name, overall: p.overall })),
          team2: resolved.team2,
          team2Receives: resolved.team1Players.map(p => ({ name: p.name, overall: p.overall }))
        };
        
        // Call story generation API
        const response = await fetch('https://hofsn-news.manus.space/api/generate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storyPayload)
        });
        
        if (response.ok) {
          console.log('[Trade Handler] Story generation triggered successfully');
        } else {
          console.error('[Trade Handler] Story generation failed:', response.statusText);
        }
      } catch (error) {
        console.error('[Trade Handler] Failed to trigger story generation:', error);
      }
    }
    
    const team1PlayerNames = resolved.team2Players.map(p => p.name).join(', ');
    const team2PlayerNames = resolved.team1Players.map(p => p.name).join(', ');
    
    return {
      success: true,
      message: 
        `**${resolved.team1}** received: ${team1PlayerNames}\n` +
        `**${resolved.team2}** received: ${team2PlayerNames}`
    };
  } catch (error) {
    console.error('[Trade Handler] Error processing trade:', error);
    return { success: false, message: 'An error occurred while processing the trade' };
  }
}
