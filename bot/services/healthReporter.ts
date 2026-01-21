/**
 * Health Reporter Service
 * 
 * Periodically reports bot health status to the admin channel
 * Provides automatic health monitoring without external scripts
 */

import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { logger } from './logger';
import { HealthService } from './health';
import { config } from '../config';

interface HealthReport {
  timestamp: Date;
  status: string;
  uptime: number;
  discordConnected: boolean;
  databaseConnected: boolean;
  errors: string[];
}

class HealthReporterClass {
  private client: Client | null = null;
  private reportInterval: NodeJS.Timeout | null = null;
  private lastReportStatus: string | null = null;
  private reportIntervalMs: number = 3600000; // 1 hour default

  /**
   * Initialize health reporter
   */
  initialize(client: Client, intervalMinutes: number = 60): void {
    this.client = client;
    this.reportIntervalMs = intervalMinutes * 60 * 1000;
    
    // Start periodic reporting
    this.startReporting();
    
    logger.info(`✅ Health reporter initialized (${intervalMinutes}min interval)`);
  }

  /**
   * Start periodic health reporting
   */
  private startReporting(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    // Report immediately on startup
    this.reportHealth();

    // Then report periodically
    this.reportInterval = setInterval(() => {
      this.reportHealth();
    }, this.reportIntervalMs);
  }

  /**
   * Report health status to admin channel
   */
  private async reportHealth(): Promise<void> {
    if (!this.client) {
      logger.warn('Health reporter: Client not initialized');
      return;
    }

    try {
      const status = HealthService.getStatus();
      const report: HealthReport = {
        timestamp: new Date(),
        status: status.status,
        uptime: status.uptime,
        discordConnected: status.discord.connected,
        databaseConnected: status.database.connected,
        errors: status.errors,
      };

      // Get admin channel
      const channel = await this.client.channels.fetch(config.channels.admin);
      if (!channel || !channel.isTextBased()) {
        logger.warn('Health reporter: Admin channel not found');
        return;
      }

      // Only report if status changed or it's been a while
      const statusChanged = report.status !== this.lastReportStatus;
      if (!statusChanged && this.lastReportStatus === 'healthy') {
        logger.debug('Health reporter: Status unchanged (healthy), skipping report');
        return;
      }

      // Create health report embed
      const embed = new EmbedBuilder()
        .setTitle('📊 Scheduled Health Report')
        .setColor(
          report.status === 'healthy' ? 0x00FF00 :
          report.status === 'degraded' ? 0xFFFF00 :
          0xFF0000
        )
        .addFields(
          {
            name: 'Status',
            value: `**${report.status.toUpperCase()}**`,
            inline: true,
          },
          {
            name: 'Uptime',
            value: this.formatUptime(report.uptime),
            inline: true,
          },
          {
            name: 'Report Time',
            value: report.timestamp.toLocaleString('en-US', { timeZone: 'America/New_York' }),
            inline: false,
          },
          {
            name: '🔌 Discord',
            value: report.discordConnected ? '✅ Connected' : '❌ Disconnected',
            inline: true,
          },
          {
            name: '🗄️ Database',
            value: report.databaseConnected ? '✅ Connected' : '❌ Disconnected',
            inline: true,
          }
        );

      // Add errors if any (limit to 5 errors)
      if (report.errors.length > 0) {
        const errorList = report.errors
          .slice(0, 5)
          .map((err, i) => `${i + 1}. ${err.substring(0, 100)}`)
          .join("\n");
        embed.addFields({
          name: "⚠️ Recent Errors",
          value: errorList || "No errors",
          inline: false,
        });
      }

      // Send report
      await (channel as TextChannel).send({ embeds: [embed] });
      this.lastReportStatus = report.status;

      logger.info(`Health report sent: ${report.status.toUpperCase()}`);
    } catch (error) {
      logger.error('Error sending health report:', error);
    }
  }

  /**
   * Format uptime in human readable format
   */
  private formatUptime(seconds: number): string {
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
   * Stop health reporting
   */
  stop(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    logger.info('Health reporter stopped');
  }

  /**
   * Manually trigger a health report
   */
  async reportNow(): Promise<void> {
    logger.info('Manually triggering health report...');
    await this.reportHealth();
  }
}

// Export singleton
export const HealthReporter = new HealthReporterClass();
