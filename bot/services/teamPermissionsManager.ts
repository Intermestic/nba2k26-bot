import { Client, Guild, GuildMember, Role, PermissionFlagsBits, ChannelType, CategoryChannel } from 'discord.js';
import { logger } from './logger';
import { DatabaseService } from './database';
import * as schema from '../../drizzle/schema';

const TEAM_PAGES_CATEGORY_ID = '1314026858851508224';
const TEAM_CHANNEL_MAP: Record<string, string> = {
  '76ers': '1314026916875063318',
  'Bucks': '1314026930938806332',
  'Bulls': '1314026948110442537',
  'Cavaliers': '1314026963948138496',
  'Celtics': '1314026977793634355',
  'Grizzlies': '1314026992863862794',
  'Hawks': '1314027007166226503',
  'Heat': '1314027022387679293',
  'Hornets': '1314027037051043840',
  'Jazz': '1314027051374895185',
  'Kings': '1314027065803792475',
  'Knicks': '1314027080366526475',
  'Lakers': '1314027095495041024',
  'Magic': '1314027109923942440',
  'Mavericks': '1314027124717543454',
  'Nets': '1314027139242270721',
  'Nuggets': '1314027153628266496',
  'Pacers': '1314027168174219324',
  'Pelicans': '1314027182447136788',
  'Pistons': '1314027196875907112',
  'Raptors': '1314027211228569600',
  'Rockets': '1314027225426919464',
  'Sixers': '1314027239163936790',
  'Spurs': '1314027253458006016',
  'Suns': '1314027267588837376',
  'Timberwolves': '1314027281962336307',
  'Trail Blazers': '1314027296365948988',
  'Warriors': '1314027310744072192',
  'Wizards': '1314027325147693056',
};

const ADMIN_ROLE_ID = '1095937247523651614';

interface TeamAssignment {
  discordUserId: string;
  team: string;
  username: string | null;
}

/**
 * Service to manage team permissions and roles
 */
export class TeamPermissionsManagerService {
  private client: Client;
  private guild: Guild | null = null;
  private db = DatabaseService;

  constructor(client: Client) {
    this.client = client;
    this.db = DatabaseService;
  }

  /**
   * Initialize the service and fetch guild
   */
  async initialize(): Promise<void> {
    try {
      const guilds = await this.client.guilds.fetch();
      if (guilds.size === 0) {
        logger.warn('No guilds found for team permissions manager');
        return;
      }

      this.guild = await this.client.guilds.fetch(guilds.first()!.id);
      logger.info('Team Permissions Manager initialized');
    } catch (error) {
      logger.error('Error initializing team permissions manager:', error);
    }
  }

  /**
   * Get all team assignments from database
   */
  async getAllTeamAssignments(): Promise<TeamAssignment[]> {
    try {
      const assignments = await this.db.query(async (db) => {
        return await db.select().from(schema.teamAssignments);
      });

      if (!assignments) {
        logger.warn('No team assignments found');
        return [];
      }

      return assignments.map((a) => ({
        discordUserId: a.discordUserId,
        team: a.team,
        username: a.discordUsername,
      }));
    } catch (error) {
      logger.error('Error fetching team assignments:', error);
      return [];
    }
  }

  /**
   * Get team assignment for a specific user
   */
  async getUserTeamAssignment(discordUserId: string): Promise<TeamAssignment | null> {
    try {
      const assignment = await this.db.query(async (db) => {
        const result = await db
          .select()
          .from(schema.teamAssignments)
          .where(schema.teamAssignments.discordUserId.eq(discordUserId))
          .limit(1);

        return result.length > 0 ? result[0] : null;
      });

      if (!assignment) {
        return null;
      }

      return {
        discordUserId: assignment.discordUserId,
        team: assignment.team,
        username: assignment.discordUsername,
      };
    } catch (error) {
      logger.error(`Error fetching team assignment for user ${discordUserId}:`, error);
      return null;
    }
  }

  /**
   * Sync team roles and permissions for a user
   */
  async syncUserPermissions(discordUserId: string): Promise<void> {
    if (!this.guild) {
      logger.warn('Guild not initialized, cannot sync permissions');
      return;
    }

    try {
      const member = await this.guild.members.fetch(discordUserId);
      if (!member) {
        logger.warn(`Member not found: ${discordUserId}`);
        return;
      }

      const assignment = await this.getUserTeamAssignment(discordUserId);
      const isAdmin = member.roles.cache.some(r => r.id === ADMIN_ROLE_ID);

      // Get all team roles
      const allTeamRoles = await this.getAllTeamRoles();

      if (false && isAdmin) { // // Disabled - admins don't need team roles, they have full access via admin role
        // Admins don't need team roles, they have full access via admin role
        logger.debug(`User ${member.user.tag} is admin, skipping team role assignment`);
      } else {
        // Remove all team roles first
        for (const role of allTeamRoles) {
          if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
          }
        }

        // Assign the correct team role
        const teamRole = await this.getTeamRole(assignment.team);
        logger.info(`[TeamPerms] Looking for role: ${assignment.team}, found: ${teamRole ? teamRole.name : 'NULL'}`);
        if (teamRole) {
          await member.roles.add(teamRole);
          logger.info(`Assigned ${assignment.team} role to ${member.user.tag}`);
        } else {
          // Remove all team roles if no assignment
          const hadTeamRole = allTeamRoles.some((role) => member.roles.cache.has(role.id));

          for (const role of allTeamRoles) {
            if (member.roles.cache.has(role.id)) {
              await member.roles.remove(role);
            }
          }

          // Reset nickname if user had a team role
          if (hadTeamRole) {
            try {
              await member.setNickname(null);
              logger.info(`Reset nickname for ${member.user.tag} (removed team role)`);
            } catch (error) {
              logger.error(`Failed to reset nickname for ${member.user.tag}:`, error);
            }
          }

          logger.info(`Removed all team roles from ${member.user.tag} (no assignment)`);
        }
      }

      // Update Team Page permissions
      await this.syncTeamPagePermissions(member, assignment, isAdmin);
    } catch (error) {
      logger.error(`Error syncing permissions for user ${discordUserId}:`, error);
    }
  }

  /**
   * Sync Team Page permissions for a user
   */
  private async syncTeamPagePermissions(
    member: any,
    assignment: TeamAssignment | null,
    isAdmin: boolean
  ): Promise<void> {
    try {
      if (!this.guild) return;

      const category = await this.guild.channels.fetch(TEAM_PAGES_CATEGORY_ID);
      if (!category || category.type !== 4) { // 4 = GUILD_CATEGORY
        logger.warn('Team Pages category not found');
        return;
      }

      const channels = category.children.cache;

      for (const [, channel] of channels) {
        if (!channel.isTextBased()) continue;

        const channelName = channel.name.toLowerCase();
        const shouldHaveAccess = isAdmin || (assignment && TEAM_CHANNEL_MAP[assignment.team]?.toLowerCase() === channelName);

        // Get current permission overwrite for this member
        const currentPermission = channel.permissionOverwrites.cache.get(member.id);

        if (shouldHaveAccess) {
          // Grant access
          const permissions: ChannelPermissionOverwrite = {
            id: member.id,
            type: 'member',
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageRoles,
              PermissionFlagsBits.ManageWebhooks,
              PermissionFlagsBits.CreateInstantInvite,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.SendMessagesInThreads,
              PermissionFlagsBits.CreatePublicThreads,
              PermissionFlagsBits.CreatePrivateThreads,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.UseExternalStickers,
              PermissionFlagsBits.MentionEveryone,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.ManageThreads,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.SendTTSMessages,
            ],
          };

          if (!currentPermission || currentPermission.allow.bitfield === 0) {
            await channel.permissionOverwrites.create(member, permissions);
            logger.debug(`Granted access to ${channel.name} for ${member.user.tag}`);
          }
        } else {
          // Deny access
          if (!currentPermission) {
            await channel.permissionOverwrites.delete(member.id);
            logger.debug(`Revoked access to ${channel.name} for ${member.user.tag}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Error syncing team page permissions for user ${member.id}:`, error);
    }
  }

  /**
   * Get a team role by team name
   */
  private async getTeamRole(teamName: string): Promise<Role | null> {
    if (!this.guild) return null;

    try {
      const roles = await this.guild.roles.fetch();
      return roles.find(r => r.name === teamName) || null;
    } catch (error) {
      logger.error(`Error fetching team role for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get all team roles
   */
  private async getAllTeamRoles(): Promise<Role[]> {
    if (!this.guild) return [];

    try {
      const roles = await this.guild.roles.fetch();
      const teamNames = Object.keys(TEAM_CHANNEL_MAP);
      return Array.from(roles.filter(r => teamNames.includes(r.name)).values());
    } catch (error) {
      logger.error('Error fetching team roles:', error);
      return [];
    }
  }

  /**
   * Get a team role by team name
   */
  private async getTeamRole(teamName: string): Promise<Role | null> {
    if (!this.guild) return null;

    try {
      const roles = await this.guild.roles.fetch();
      return roles.find(r => r.name === teamName) || null;
    } catch (error) {
      logger.error(`Error fetching team role for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get all team roles
   */
  private async getAllTeamRoles(): Promise<Role[]> {
    if (!this.guild) return [];

    try {
      const roles = await this.guild.roles.fetch();
      const teamNames = Object.keys(TEAM_CHANNEL_MAP);
      return Array.from(roles.filter(r => teamNames.includes(r.name)).values());
    } catch (error) {
      logger.error('Error fetching team roles:', error);
      return [];
    }
  }

  /**
   * Handle team assignment change
   */
  async handleTeamAssignmentChange(discordUserId: string): Promise<void> {
    logger.info(`Team assignment changed for user ${discordUserId}, syncing permissions...`);
    await this.syncUserPermissions(discordUserId);
  }

  /**
   * Handle team assignment deletion
   */
  async handleTeamAssignmentDeletion(discordUserId: string): Promise<void> {
    if (!this.guild) {
      logger.warn('Guild not initialized, cannot handle assignment deletion');
      return;
    }

    try {
      const member = await this.guild.members.fetch(discordUserId);
      if (!member) {
        logger.warn(`Member not found: ${discordUserId}`);
        return;
      }

      // Remove all team roles
      const allTeamRoles = await this.getAllTeamRoles();
      for (const role of allTeamRoles) {
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
        }
      }

      // Revoke all Team Page access
      const category = await this.guild.channels.fetch(TEAM_PAGES_CATEGORY_ID);
      if (category && category.type === 4) {
        const channels = category.children.cache;
        for (const [, channel] of channels) {
          if (!channel.isTextBased()) continue;

          const perm = channel.permissionOverwrites.cache.get(member.id);
          if (perm) {
            await channel.permissionOverwrites.delete(member.id);
          }
        }
      }

      logger.info(`Removed all team access from ${member.user.tag}`);
    } catch (error) {
      logger.error(`Error handling team assignment deletion for user ${discordUserId}:`, error);
    }
  }

  /**
   * Sync permissions for all users
   */
  async syncAllUserPermissions(): Promise<void> {
    if (!this.guild) {
      logger.warn('Guild not initialized, cannot sync permissions');
      return;
    }

    try {
      const assignments = await this.getAllTeamAssignments();
      logger.info(`Syncing permissions for ${assignments.length} team assignments`);

      for (const assignment of assignments) {
        await this.syncUserPermissions(assignment.discordUserId);
      }

      logger.info('All user permissions synced');
    } catch (error) {
      logger.error('Error syncing all user permissions:', error);
    }
  }
}

// Singleton instance
let teamPermissionsManager: TeamPermissionsManagerService | null = null;

export function initTeamPermissionsManager(client: Client): TeamPermissionsManagerService {
  if (!teamPermissionsManager) {
    teamPermissionsManager = new TeamPermissionsManagerService(client);
  }
  return teamPermissionsManager;
}

export function getTeamPermissionsManager(): TeamPermissionsManagerService | null {
  return teamPermissionsManager;
}
