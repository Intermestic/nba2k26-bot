/**
 * Health Check Command
 * 
 * Provides detailed bot health status via Discord slash command
 * Shows uptime, Discord connection, database status, and recent errors
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { HealthService } from '../services/health';

export const healthCommand = {
  data: new SlashCommandBuilder()
    .setName('health')
    .setDescription('Check the bot health status and metrics'),

  async execute(interaction: any) {
    try {
      // Get current health status
      const status = HealthService.getStatus();

      // Create health embed
      const embed = new EmbedBuilder()
        .setTitle('🏥 Bot Health Status')
        .setColor(
          status.status === 'healthy' ? 0x00FF00 :
          status.status === 'degraded' ? 0xFFFF00 :
          0xFF0000
        )
        .addFields(
          {
            name: 'Status',
            value: `**${status.status.toUpperCase()}**`,
            inline: true,
          },
          {
            name: 'Uptime',
            value: formatUptime(status.uptime),
            inline: true,
          },
          {
            name: 'Last Check',
            value: new Date(status.lastCheck).toLocaleString('en-US', { timeZone: 'America/New_York' }),
            inline: false,
          },
          {
            name: '🔌 Discord Connection',
            value: status.discord.connected ? `✅ Connected (Ping: ${status.discord.latency}ms)` : '❌ Disconnected',
            inline: true,
          },
          {
            name: '📊 Guilds',
            value: `${status.discord.guilds} guild(s)`,
            inline: true,
          },
          {
            name: '🗄️ Database',
            value: status.database.connected ? '✅ Connected' : '❌ Disconnected',
            inline: true,
          }
        );

      // Add errors if any
      if (status.errors.length > 0) {
        const errorList = status.errors
          .map((err, i) => `${i + 1}. ${err}`)
          .join('\n');
        embed.addFields({
          name: '⚠️ Recent Errors',
          value: `\`\`\`${errorList}\`\`\``,
          inline: false,
        });
      }

      // Add footer with timestamp
      embed.setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });
      embed.setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error executing health command:', error);
      await interaction.reply({
        content: '❌ Error retrieving health status',
        ephemeral: true,
      });
    }
  },
};

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
