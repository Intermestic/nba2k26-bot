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

  // Health check
  new SlashCommandBuilder()
    .setName("health")
    .setDescription("Check the bot health status and metrics"),

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

  // Restart bot (admin only)
  new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Restart the Discord bot (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Award voting polls (admin only)
  new SlashCommandBuilder()
    .setName('awards')
    .setDescription('Manage award voting polls (admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup-channel')
        .setDescription('Create a dedicated test channel for award poll previews')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('preview')
        .setDescription('Post preview polls to test channel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('live')
        .setDescription('Post live polls to voting channel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check status of active polls')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

// Export command data as JSON for registration
export const commandsJSON = commands.map(cmd => cmd.toJSON());
