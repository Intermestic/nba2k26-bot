/**
 * Message Create Handler
 * 
 * Handles new messages for:
 * - FA bid detection
 * - Bot commands (if any)
 */

import { Message } from 'discord.js';
import { logger } from '../services/logger';
import { config } from '../config';
import { FABidService } from '../services/faBidding';

/**
 * Handle new message event
 */
export async function handleMessageCreate(message: Message): Promise<void> {
  // Ignore bot messages
  if (message.author.bot) return;

  const channelId = message.channelId;

  // Handle OTB command in specific channel
  if (channelId === '1095937321825730630') {
    await handleOTBCommand(message);
  }

  // Handle FA channel messages
  if (channelId === config.channels.freeAgency) {
    await handleFAChannelMessage(message);
  }

  // Handle commands (if message starts with !)
  if (message.content.startsWith('!')) {
    await handleCommand(message);
  }
}

/**
 * Handle messages in the FA channel
 */
async function handleFAChannelMessage(message: Message): Promise<void> {
  // Check if message looks like a bid
  const content = message.content.toLowerCase();
  
  // Common bid patterns: "bid X", "sign X", "cut X"
  const hasBidKeyword = content.includes('bid') || 
                        content.includes('sign') || 
                        content.includes('cut');
  
  if (hasBidKeyword) {
    logger.info(`Potential FA bid detected from ${message.author.username}`);
    await FABidService.detectBid(message);
  }
}

/**
 * Handle bot commands
 */
async function handleCommand(message: Message): Promise<void> {
  const content = message.content.toLowerCase();
  const args = content.slice(1).split(/\s+/);
  const command = args[0];

  switch (command) {
    case 'help':
      await handleHelpCommand(message);
      break;

    case 'check-trade':
      await handleCheckTradeCommand(message, args);
      break;

    case 'reverse-trade':
      await handleReverseTradeCommand(message, args);
      break;

    case 'status':
      await handleStatusCommand(message);
      break;

    default:
      // Unknown command - ignore silently
      break;
  }
}

/**
 * Handle !help command
 */
async function handleHelpCommand(message: Message): Promise<void> {
  const helpText = `
**NBA 2K26 Bot Commands**

**Trade Commands:**
• \`!check-trade <message_id>\` - Check vote status of a trade
• \`!reverse-trade <message_id>\` - Reverse a processed trade (admin only)

**General:**
• \`!status\` - Check bot status
• \`!help\` - Show this help message

**Reactions:**
• 👍 / 👎 - Vote on trades
• ❗ - Confirm FA bid (admin)
• ⚡ - Process winning bid (admin)
• ⏪ - Reverse trade (admin)
  `.trim();

  await message.reply(helpText);
}

/**
 * Handle !check-trade command
 */
async function handleCheckTradeCommand(message: Message, args: string[]): Promise<void> {
  if (args.length < 2) {
    await message.reply('Usage: `!check-trade <message_id>`');
    return;
  }

  const messageId = args[1];
  
  // Import dynamically to avoid circular dependencies
  const { TradeVotingService } = await import('../services/tradeVoting');
  await TradeVotingService.checkTradeStatus(message, messageId);
}

/**
 * Handle !reverse-trade command
 */
async function handleReverseTradeCommand(message: Message, args: string[]): Promise<void> {
  // Admin only
  if (message.author.id !== config.adminUserId) {
    await message.reply('This command is admin-only.');
    return;
  }

  if (args.length < 2) {
    await message.reply('Usage: `!reverse-trade <message_id>`');
    return;
  }

  const messageId = args[1];
  
  const { TradeVotingService } = await import('../services/tradeVoting');
  await TradeVotingService.reverseTradeByMessageId(message, messageId);
}

/**
 * Handle !status command
 */
async function handleStatusCommand(message: Message): Promise<void> {
  const { DatabaseService } = await import('../services/database');
  
  const dbStatus = DatabaseService.isHealthy() ? '✅ Connected' : '❌ Disconnected';
  
  const statusText = `
**Bot Status**
• Discord: ✅ Online
• Database: ${dbStatus}
• Uptime: ${formatUptime(process.uptime())}
  `.trim();

  await message.reply(statusText);
}

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

/**
 * Handle OTB (On The Block) command
 * When a user says "otb" (case-insensitive), respond with their team roster link and top players
 */
async function handleOTBCommand(message: Message): Promise<void> {
  const content = message.content.toLowerCase().trim();
  
  // Check if message contains "otb" (case-insensitive)
  if (!content.includes('otb')) {
    return;
  }
  
  // Get user's team from their Discord roles
  const member = message.member;
  if (!member) {
    return;
  }
  
  // Team names to look for in roles
  const teamNames = [
    'Hawks', 'Celtics', 'Nets', 'Hornets', 'Bulls', 'Cavaliers', 'Mavericks', 'Nuggets',
    'Pistons', 'Warriors', 'Rockets', 'Pacers', 'Clippers', 'Lakers', 'Grizzlies', 'Heat',
    'Bucks', 'Timberwolves', 'Pelicans', 'Knicks', 'Thunder', 'Magic', 'Sixers', 'Suns',
    'Trail Blazers', 'Kings', 'Spurs', 'Raptors', 'Jazz', 'Wizards'
  ];
  
  // Find team role
  let userTeam: string | null = null;
  for (const role of member.roles.cache.values()) {
    const roleName = role.name;
    if (teamNames.includes(roleName)) {
      userTeam = roleName;
      break;
    }
  }
  
  if (!userTeam) {
    // User doesn't have a team role
    await message.reply('❌ Could not find your team. Make sure you have a team role assigned.');
    return;
  }
  
  // Generate roster link
  const rosterLink = `https://hof17roster.manus.space/players?team=${encodeURIComponent(userTeam)}`;
  
  // Reply with clickable link (angle brackets suppress Discord embed preview)
  await message.reply(`[${userTeam} Roster](<${rosterLink}>)`);
  
  logger.info(`OTB command: ${message.author.username} (${userTeam}) → ${rosterLink}`);
}
