/**
 * Interaction Handler
 * 
 * Handles all slash command interactions from Discord.
 * Routes commands to their respective handlers.
 */

import { 
  ChatInputCommandInteraction, 
  Client, 
  EmbedBuilder,
  Message
} from 'discord.js';
import { logger } from '../services/logger';
import { config } from '../config';
import { TradeVotingService } from '../services/tradeVoting';
import { HealthService } from '../services/health';
import { TradeParser } from '../parsers/tradeParser';

/**
 * Handle slash command interactions
 */
export async function handleInteraction(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const { commandName, user } = interaction;
  
  logger.info(`Slash command: /${commandName} by ${user.tag}`);

  try {
    switch (commandName) {
      case 'check-trade':
        await handleCheckTrade(interaction, client);
        break;
      case 'reverse-trade':
        await handleReverseTrade(interaction, client);
        break;
      case 'bot-status':
        await handleBotStatus(interaction);
        break;
      case 'help':
        await handleHelp(interaction);
        break;
      case 'force-process':
        await handleForceProcess(interaction, client);
        break;
      default:
        await interaction.reply({
          content: '❌ Unknown command',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error(`Error handling /${commandName}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: `❌ Error: ${errorMessage}`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `❌ Error: ${errorMessage}`,
        ephemeral: true
      });
    }
  }
}

/**
 * /check-trade - Check vote status on a trade
 */
async function handleCheckTrade(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const messageId = interaction.options.getString('message_id');
  
  if (!messageId) {
    await interaction.editReply({
      content: '❌ Please provide a message ID. Right-click the trade message → Copy ID'
    });
    return;
  }

  try {
    // Get the trade channel
    const channel = await client.channels.fetch(config.channels.trades);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({ content: '❌ Trade channel not found' });
      return;
    }

    // Fetch the message
    const message = await (channel as any).messages.fetch(messageId);
    if (!message) {
      await interaction.editReply({ content: '❌ Message not found' });
      return;
    }

    // Count votes
    const upvotes = message.reactions.cache.get('👍')?.count || 0;
    const downvotes = message.reactions.cache.get('👎')?.count || 0;
    
    // Subtract bot's own reactions
    const botUpvote = message.reactions.cache.get('👍')?.users.cache.has(client.user?.id || '') ? 1 : 0;
    const botDownvote = message.reactions.cache.get('👎')?.users.cache.has(client.user?.id || '') ? 1 : 0;
    
    const actualUpvotes = upvotes - botUpvote;
    const actualDownvotes = downvotes - botDownvote;

    // Determine status
    let status = '⏳ Pending';
    let statusColor = 0xFFFF00; // Yellow
    
    if (actualUpvotes >= config.voting.approvalThreshold) {
      status = '✅ Approved';
      statusColor = 0x00FF00; // Green
    } else if (actualDownvotes >= config.voting.rejectionThreshold) {
      status = '❌ Rejected';
      statusColor = 0xFF0000; // Red
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle('Trade Vote Status')
      .setColor(statusColor)
      .addFields(
        { name: '👍 Upvotes', value: `${actualUpvotes}/${config.voting.approvalThreshold}`, inline: true },
        { name: '👎 Downvotes', value: `${actualDownvotes}/${config.voting.rejectionThreshold}`, inline: true },
        { name: 'Status', value: status, inline: true }
      )
      .setFooter({ text: `Message ID: ${messageId}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.error('Error checking trade:', error);
    await interaction.editReply({ content: '❌ Failed to check trade. Is the message ID correct?' });
  }
}

/**
 * /reverse-trade - Reverse a processed trade (admin only)
 */
async function handleReverseTrade(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  // Check if user is admin
  if (interaction.user.id !== config.admins.ownerId) {
    await interaction.reply({
      content: '❌ Only admins can reverse trades',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();
  
  const messageId = interaction.options.getString('message_id', true);

  try {
    // Get the trade channel
    const channel = await client.channels.fetch(config.channels.trades);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({ content: '❌ Trade channel not found' });
      return;
    }

    // Fetch the message
    const message = await (channel as any).messages.fetch(messageId);
    if (!message) {
      await interaction.editReply({ content: '❌ Message not found' });
      return;
    }

    // Parse the trade
    const trade = TradeParser.parse(message);
    if (!trade) {
      await interaction.editReply({ content: '❌ Could not parse trade from message' });
      return;
    }

    // Reverse the trade using TradeVotingService
    const result = await TradeVotingService.reverseTrade(message);
    
    if (result.success) {
      await interaction.editReply({
        content: `✅ Trade reversed successfully!\n${result.message}`
      });
    } else {
      await interaction.editReply({
        content: `❌ Failed to reverse trade: ${result.message}`
      });
    }

  } catch (error) {
    logger.error('Error reversing trade:', error);
    await interaction.editReply({ content: '❌ Failed to reverse trade' });
  }
}

/**
 * /bot-status - View bot health status
 */
async function handleBotStatus(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const health = HealthService.getStatus();
  
  // Format uptime
  const uptimeSeconds = health.uptime;
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

  // Status color
  let statusColor = 0x00FF00; // Green
  if (health.status === 'degraded') statusColor = 0xFFFF00; // Yellow
  if (health.status === 'unhealthy') statusColor = 0xFF0000; // Red

  // Status emoji
  const statusEmoji = health.status === 'healthy' ? '✅' : 
                      health.status === 'degraded' ? '⚠️' : '❌';

  const embed = new EmbedBuilder()
    .setTitle('🤖 Bot Status')
    .setColor(statusColor)
    .addFields(
      { name: 'Status', value: `${statusEmoji} ${health.status.toUpperCase()}`, inline: true },
      { name: 'Uptime', value: uptimeStr, inline: true },
      { name: 'Discord', value: health.discord.connected ? `✅ Connected (${health.discord.latency}ms)` : '❌ Disconnected', inline: true },
      { name: 'Database', value: health.database.connected ? '✅ Connected' : '❌ Disconnected', inline: true },
      { name: 'Servers', value: `${health.discord.guilds}`, inline: true },
      { name: 'Last Check', value: new Date(health.lastCheck).toLocaleTimeString(), inline: true }
    )
    .setTimestamp();

  if (health.errors.length > 0) {
    embed.addFields({
      name: '⚠️ Recent Errors',
      value: health.errors.slice(0, 3).join('\n') || 'None'
    });
  }

  await interaction.reply({ embeds: [embed] });
}

/**
 * /help - Show available commands
 */
async function handleHelp(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('🏀 NBA 2K26 Bot Commands')
    .setColor(0x0099FF)
    .setDescription('Here are the available slash commands:')
    .addFields(
      { 
        name: '/check-trade', 
        value: 'Check the current vote status on a trade message.\nProvide the message ID (right-click → Copy ID).' 
      },
      { 
        name: '/reverse-trade', 
        value: '*(Admin only)* Reverse a processed trade.\nRequires the trade message ID.' 
      },
      { 
        name: '/force-process', 
        value: '*(Admin only)* Force approve or reject a trade regardless of votes.' 
      },
      { 
        name: '/bot-status', 
        value: 'View bot health status, uptime, and connection info.' 
      },
      { 
        name: '/help', 
        value: 'Show this help message.' 
      }
    )
    .addFields({
      name: '📊 Voting Thresholds',
      value: `• **Approval**: ${config.voting.approvalThreshold} upvotes (👍)\n• **Rejection**: ${config.voting.rejectionThreshold} downvotes (👎)`
    })
    .addFields({
      name: '💡 Tips',
      value: '• React with 👍 or 👎 on trade messages to vote\n• Admins can use ⏪ reaction to reverse trades\n• FA bids use ❗ (confirm) and ⚡ (process)'
    })
    .setFooter({ text: 'NBA 2K26 Discord Bot' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * /force-process - Force process a trade (admin only)
 */
async function handleForceProcess(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  // Check if user is admin
  if (interaction.user.id !== config.admins.ownerId) {
    await interaction.reply({
      content: '❌ Only admins can force process trades',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();
  
  const messageId = interaction.options.getString('message_id', true);
  const action = interaction.options.getString('action', true);

  try {
    // Get the trade channel
    const channel = await client.channels.fetch(config.channels.trades);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({ content: '❌ Trade channel not found' });
      return;
    }

    // Fetch the message
    const message = await (channel as any).messages.fetch(messageId);
    if (!message) {
      await interaction.editReply({ content: '❌ Message not found' });
      return;
    }

    if (action === 'approve') {
      const result = await TradeVotingService.processApproval(message);
      if (result.success) {
        await interaction.editReply({
          content: `✅ Trade force-approved!\n${result.message}`
        });
      } else {
        await interaction.editReply({
          content: `❌ Failed to approve trade: ${result.message}`
        });
      }
    } else {
      // Just mark as rejected (no player movements needed)
      await message.reply('❌ **Trade Rejected** (Force-rejected by admin)');
      await interaction.editReply({ content: '✅ Trade force-rejected!' });
    }

  } catch (error) {
    logger.error('Error force processing trade:', error);
    await interaction.editReply({ content: '❌ Failed to process trade' });
  }
}
