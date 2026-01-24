import { SlashCommandBuilder } from 'discord.js';

export const awardsCommand = new SlashCommandBuilder()
  .setName('awards')
  .setDescription('Manage award voting polls')
  .addSubcommand(subcommand =>
    subcommand
      .setName('preview')
      .setDescription('Post preview polls to admin channel (admin only)')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('live')
      .setDescription('Post live polls to voting channel (admin only)')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('Check status of active polls (admin only)')
  );
