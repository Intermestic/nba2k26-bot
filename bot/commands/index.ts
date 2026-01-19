/**
 * Slash Command Definitions
 * 
 * Defines all slash commands for the NBA 2K26 Discord Bot.
 * These are registered with Discord API and shown in the command picker.
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

// Command definitions
export const commands = [
  // Check trade vote status
  new SlashCommandBuilder()
    .setName('check-trade')
    .setDescription('Check the current vote status on a trade')
    .addStringOption(option =>
      option
        .setName('message_id')
        .setDescription('The message ID of the trade (right-click message → Copy ID)')
        .setRequired(false)
    ),

  // Reverse a processed trade (admin only)
  new SlashCommandBuilder()
    .setName('reverse-trade')
    .setDescription('Reverse a processed trade (admin only)')
    .addStringOption(option =>
      option
        .setName('message_id')
        .setDescription('The message ID of the trade to reverse')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Bot status
  new SlashCommandBuilder()
    .setName('bot-status')
    .setDescription('View bot health status and uptime'),

  // Help command
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available bot commands and usage'),

  // Scan for missed trades (admin only)
  new SlashCommandBuilder()
    .setName('scan-trades')
    .setDescription('Scan for missed trade votes and process them (admin only)')
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Number of messages to scan (default: 100, max: 500)')
        .setRequired(false)
        .setMinValue(10)
        .setMaxValue(500)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Force process a trade (admin only)
  new SlashCommandBuilder()
    .setName('force-process')
    .setDescription('Force process a trade regardless of vote count (admin only)')
    .addStringOption(option =>
      option
        .setName('message_id')
        .setDescription('The message ID of the trade to process')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Approve or reject the trade')
        .setRequired(true)
        .addChoices(
          { name: 'Approve', value: 'approve' },
          { name: 'Reject', value: 'reject' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

// Export command data as JSON for registration
export const commandsJSON = commands.map(cmd => cmd.toJSON());
