/**
 * Cap Status Updater Service
 * 
 * Handles updating Discord cap status messages and managing over-cap roles
 * for teams that exceed the 1098 total overall cap limit.
 */

import { Client, EmbedBuilder, TextChannel, Role, Guild } from 'discord.js';
import { logger } from './logger';
import { DatabaseService } from './database';
import { config } from '../config';
import { eq } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { TEAM_USER_MAPPING } from './teamMapping';

// Cap limit constant
const CAP_LIMIT = 1098;

// Discord role ID for over-cap teams
const OVER_CAP_ROLE_ID = '1208391241461665832'; // OVERCAP role

// Message IDs for cap status embeds
const CAP_STATUS_MESSAGE_IDS = {
  part1: '1440840392562970674',
  part2: '1440840389882941603',
};

// Channel ID where cap status messages are posted
const CAP_STATUS_CHANNEL_ID = '1280019275679137865'; // Cap status channel



interface TeamCapStatus {
  team: string;
  playerCount: number;
  totalOverall: number;
  isOverCap: boolean;
  overCapAmount: number;
}

export class CapStatusUpdaterService {
  private client: Client;
  private db: typeof DatabaseService;

  constructor(client: Client) {
    this.client = client;
    this.db = DatabaseService;
  }

  /**
   * Calculate cap status for all teams
   */
  async calculateAllTeamCapStatus(): Promise<TeamCapStatus[]> {
    try {
      const db = await this.db.getDB();
      if (!db) {
        logger.warn('Database not available for cap status calculation');
        return [];
      }

      // Get all players grouped by team
      const players = await db.select().from(schema.players);
      
      // Group by team and calculate totals
      const teamStats = new Map<string, { count: number; total: number }>();
      
      for (const player of players) {
        if (!player.team) continue;
        
        const current = teamStats.get(player.team) || { count: 0, total: 0 };
        current.count += 1;
        current.total += player.overall || 0;
        teamStats.set(player.team, current);
      }

      // Convert to TeamCapStatus array
      const capStatuses: TeamCapStatus[] = [];
      for (const [team, stats] of teamStats) {
        const isOverCap = stats.total > CAP_LIMIT;
        capStatuses.push({
          team,
          playerCount: stats.count,
          totalOverall: stats.total,
          isOverCap,
          overCapAmount: isOverCap ? stats.total - CAP_LIMIT : 0,
        });
      }

      return capStatuses.sort((a, b) => a.team.localeCompare(b.team));
    } catch (error) {
      logger.error('Error calculating team cap status:', error);
      return [];
    }
  }

  /**
   * Update Discord cap status messages
   */
  async updateCapStatusMessages(client: Client): Promise<void> {
    try {
      const capStatuses = await this.calculateAllTeamCapStatus();
      if (capStatuses.length === 0) {
        logger.warn('No cap status data available');
        return;
      }

      // Get the channel
      const channel = await client.channels.fetch(CAP_STATUS_CHANNEL_ID);
      if (!channel || !channel.isTextBased()) {
        logger.error('Cap status channel not found or not text-based');
        return;
      }

      // Separate teams into two parts (15 teams each for two embeds)
      const part1Teams = capStatuses.slice(0, 15);
      const part2Teams = capStatuses.slice(15);

      // Build embeds
      const embed1 = this.buildCapStatusEmbed(part1Teams, 1);
      const embed2 = this.buildCapStatusEmbed(part2Teams, 2);

      // Update messages
      await this.updateMessage(channel as TextChannel, CAP_STATUS_MESSAGE_IDS.part1, embed1);
      if (part2Teams.length > 0) {
        await this.updateMessage(channel as TextChannel, CAP_STATUS_MESSAGE_IDS.part2, embed2);
      }

      logger.info('Cap status messages updated successfully');
    } catch (error) {
      logger.error('Error updating cap status messages:', error);
    }
  }

  /**
   * Build cap status embed for a set of teams
   */
  private buildCapStatusEmbed(teams: TeamCapStatus[], part: number): EmbedBuilder {
    const overCapCount = teams.filter(t => t.isOverCap).length;
    
    const embed = new EmbedBuilder()
      .setTitle(`🏀 NBA 2K26 Team Cap Status (Part ${part}/${part === 1 ? '2' : '2'})`)
      .setColor(overCapCount > 0 ? 0xFF0000 : 0x00FF00)
      .addFields({
        name: 'Cap Limit',
        value: `${CAP_LIMIT} Total Overall`,
        inline: false,
      });

    if (overCapCount > 0) {
      embed.addFields({
        name: '🚨 Over Cap',
        value: `${overCapCount} ${overCapCount === 1 ? 'team' : 'teams'}`,
        inline: false,
      });
    }

    // Add team status
    const teamLines: string[] = [];
    for (const team of teams) {
      const status = team.isOverCap 
        ? `🔴 (${team.playerCount}/14) - ${team.totalOverall} (+${team.overCapAmount})`
        : `✅ (${team.playerCount}/14) - ${team.totalOverall}`;
      teamLines.push(`**${team.team}**\n${status}`);
    }

    if (teamLines.length > 0) {
      embed.addFields({
        name: 'Team Rosters',
        value: teamLines.join('\n\n'),
        inline: false,
      });
    }

    // Add link to website
    embed.addFields({
      name: 'View all rosters',
      value: 'https://tinyurl.com/hof2k',
      inline: false,
    });

    // Add timestamp
    embed.setFooter({ text: `Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} | Yesterday at ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })}` });
    embed.setTimestamp();

    return embed;
  }

  /**
   * Update a specific message with new embed
   */
  private async updateMessage(channel: TextChannel, messageId: string, embed: EmbedBuilder): Promise<void> {
    try {
      const message = await channel.messages.fetch(messageId);
      if (message) {
        await message.edit({ embeds: [embed] });
        logger.debug(`Updated message ${messageId}`);
      }
    } catch (error) {
      logger.error(`Error updating message ${messageId}:`, error);
    }
  }

  /**
   * Update over-cap roles for users
   */
  async updateOverCapRoles(client: Client): Promise<void> {
    try {
      const guild = await client.guilds.fetch();
      if (guild.size === 0) {
        logger.warn('No guilds found for role updates');
        return;
      }

      const guildId = guild.first()?.id;
      if (!guildId) return;

      const guildObj = await client.guilds.fetch(guildId);
      const capStatuses = await this.calculateAllTeamCapStatus();
      const overCapTeams = new Set(capStatuses.filter(t => t.isOverCap).map(t => t.team));

      // Get the over-cap role
      const overCapRole = await guildObj.roles.fetch(OVER_CAP_ROLE_ID);
      if (!overCapRole) {
        logger.warn('Over-cap role not found');
        return;
      }

      // Update roles for each team owner
      for (const [team, userId] of Object.entries(TEAM_USER_MAPPING)) {
        try {
          const member = await guildObj.members.fetch(userId);
          if (!member) {
            logger.warn(`Member not found for user ID ${userId}`);
            continue;
          }

          const isTeamOverCap = overCapTeams.has(team);
          const hasOverCapRole = member.roles.cache.some(r => r.id === OVER_CAP_ROLE_ID);

          if (isTeamOverCap && !hasOverCapRole) {
            // Add role
            await member.roles.add(overCapRole);
            logger.info(`Added Over Cap role to ${member.user.tag} (${team})`);
          } else if (!isTeamOverCap && hasOverCapRole) {
            // Remove role
            await member.roles.remove(overCapRole);
            logger.info(`Removed Over Cap role from ${member.user.tag} (${team})`);
          }
        } catch (error) {
          logger.error(`Error updating roles for team ${team} (user ${userId}):`, error);
        }
      }

      logger.info('Over-cap roles updated successfully');
    } catch (error) {
      logger.error('Error updating over-cap roles:', error);
    }
  }

  /**
   * Update both messages and roles
   */
  async updateAll(client: Client): Promise<void> {
    logger.info('Starting cap status update...');
    await this.updateCapStatusMessages(client);
    await this.updateOverCapRoles(client);
    logger.info('Cap status update complete');
  }
}

// Singleton instance
let capStatusUpdater: CapStatusUpdaterService | null = null;

export function initCapStatusUpdater(client: Client): CapStatusUpdaterService {
  if (!capStatusUpdater) {
    capStatusUpdater = new CapStatusUpdaterService(client);
  }
  return capStatusUpdater;
}

export function getCapStatusUpdater(): CapStatusUpdaterService | null {
  return capStatusUpdater;
}
