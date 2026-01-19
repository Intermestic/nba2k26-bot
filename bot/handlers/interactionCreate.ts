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
import { StartupScanner } from '../services/startupScanner';

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
      case 'scan-trades':
        await handleScanTrades(interaction, client);
        break;
      case 'restart':
        await handleRestart(interaction);
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
      },
      { 
        name: '/scan-trades', 
        value: '*(Admin only)* Manually scan for missed trade votes.' 
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


/**
 * /scan-trades - Manually scan for missed trade votes (admin only)
 */
async function handleScanTrades(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  // Check if user is admin
  if (interaction.user.id !== config.admins.ownerId) {
    await interaction.reply({
      content: '❌ Only admins can trigger trade scans',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  const limit = interaction.options.getInteger('limit') || 100;

  try {
    logger.info(`Manual trade scan triggered by ${interaction.user.tag} (limit: ${limit})`);

    // Get the trade channel
    const channel = await client.channels.fetch(config.channels.trades);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({ content: '❌ Trade channel not found' });
      return;
    }

    // Fetch messages
    const messages = await (channel as any).messages.fetch({ limit });
    
    let scannedCount = 0;
    let processedCount = 0;
    const processedTrades: string[] = [];

    for (const [messageId, message] of messages) {
      // Skip messages before the filter
      if (BigInt(messageId) < BigInt(config.filters.minTradeMessageId)) {
        continue;
      }

      scannedCount++;

      // Check if this message has trade-like reactions
      const upvoteReaction = message.reactions.cache.find((r: any) => r.emoji.name === config.emojis.upvote);
      const downvoteReaction = message.reactions.cache.find((r: any) => r.emoji.name === config.emojis.downvote);

      if (!upvoteReaction && !downvoteReaction) {
        continue; // No votes, skip
      }

      const upvotes = upvoteReaction ? (upvoteReaction.count - (upvoteReaction.me ? 1 : 0)) : 0;
      const downvotes = downvoteReaction ? (downvoteReaction.count - (downvoteReaction.me ? 1 : 0)) : 0;

      // Check if thresholds are met but trade wasn't processed
      if (upvotes >= config.voting.approvalThreshold || downvotes >= config.voting.rejectionThreshold) {
        // Check if already has success/error reaction (already processed)
        const hasSuccessReaction = message.reactions.cache.some((r: any) => r.emoji.name === config.emojis.success);
        const hasErrorReaction = message.reactions.cache.some((r: any) => r.emoji.name === config.emojis.error);

        if (!hasSuccessReaction && !hasErrorReaction) {
          logger.info(`Found unprocessed trade ${messageId} with ${upvotes} 👍 / ${downvotes} 👎`);
          
          // Process the trade
          if (upvotes >= config.voting.approvalThreshold) {
            const upvoteR = message.reactions.cache.find((r: any) => r.emoji.name === config.emojis.upvote);
            if (upvoteR) {
              const users = await upvoteR.users.fetch();
              const firstUser = users.first();
              if (firstUser) {
                await TradeVotingService.handleVote(upvoteR, firstUser, true);
                processedTrades.push(`✅ ${messageId} (${upvotes} 👍)`);
                processedCount++;
              }
            }
          } else if (downvotes >= config.voting.rejectionThreshold) {
            const downvoteR = message.reactions.cache.find((r: any) => r.emoji.name === config.emojis.downvote);
            if (downvoteR) {
              const users = await downvoteR.users.fetch();
              const firstUser = users.first();
              if (firstUser) {
                await TradeVotingService.handleVote(downvoteR, firstUser, false);
                processedTrades.push(`❌ ${messageId} (${downvotes} 👎)`);
                processedCount++;
              }
            }
          }
        }
      }
    }

    // Build response embed
    const embed = new EmbedBuilder()
      .setTitle('🔍 Trade Scan Complete')
      .setColor(processedCount > 0 ? 0x00FF00 : 0x0099FF)
      .addFields(
        { name: 'Messages Scanned', value: `${scannedCount}`, inline: true },
        { name: 'Trades Processed', value: `${processedCount}`, inline: true },
        { name: 'Scan Limit', value: `${limit}`, inline: true }
      )
      .setTimestamp();

    if (processedTrades.length > 0) {
      embed.addFields({
        name: 'Processed Trades',
        value: processedTrades.slice(0, 10).join('\n') + 
               (processedTrades.length > 10 ? `\n... and ${processedTrades.length - 10} more` : '')
      });
    } else {
      embed.setDescription('No unprocessed trades found that meet the voting thresholds.');
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.error('Error during manual trade scan:', error);
    await interaction.editReply({ content: '❌ Failed to complete trade scan' });
  }
}


/**
 * /restart - Restart the bot (admin only, admin channel only)
 */
async function handleRestart(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  // Check if user is admin
  if (interaction.user.id !== config.admins.ownerId) {
    await interaction.reply({
      content: '❌ Only admins can restart the bot',
      ephemeral: true
    });
    return;
  }

  // Check if command is used in admin channel
  if (interaction.channelId !== config.channels.admin) {
    await interaction.reply({
      content: `❌ This command can only be used in <#${config.channels.admin}>`,
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  try {
    logger.info(`Bot restart requested by ${interaction.user.tag}`);

    // Call the HTTP restart endpoint
    const response = await fetch('http://localhost:3001/restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      await interaction.editReply({
        content: '✅ Bot restart initiated. The bot will restart in a few seconds.'
      });
      logger.info('Bot restart endpoint called successfully');
    } else {
      await interaction.editReply({
        content: '❌ Failed to call restart endpoint. The bot may not be responding.'
      });
      logger.error(`Restart endpoint returned status ${response.status}`);
    }

  } catch (error) {
    logger.error('Error calling restart endpoint:', error);
    await interaction.editReply({
      content: '❌ Failed to restart bot. Please check the logs.'
    });
  }
}
