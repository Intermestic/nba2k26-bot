import type { Message, ButtonInteraction } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { parseTrade, resolveTradePlayer } from './trade-parser';
import { getDb } from './db';
import { players } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Handle trade message from trade channel
 */
export async function handleTradeMessage(message: Message) {
  console.log(`[Trade Handler] Received message in Trade channel (ID: ${message.id})`);
  
  // Ignore bot messages
  if (message.author.bot) {
    console.log(`[Trade Handler] Ignoring bot message`);
    return;
  }
  
  // Parse the trade
  const parsedTrade = parseTrade(message.content);
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
  const team1List = resolved.team1Players
    .map(p => `• ${p.name} (${p.overall} OVR)`)
    .join('\n');
  
  const team2List = resolved.team2Players
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
      `**${resolved.team1} receives:**\n${team1List}\n\n` +
      `**${resolved.team2} receives:**\n${team2List}\n\n` +
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
    // Update all players
    // Team 1 receives team 2's players
    for (const player of resolved.team2Players) {
      await db
        .update(players)
        .set({ team: resolved.team1 })
        .where(eq(players.id, player.id));
    }
    
    // Team 2 receives team 1's players
    for (const player of resolved.team1Players) {
      await db
        .update(players)
        .set({ team: resolved.team2 })
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
