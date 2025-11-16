/**
 * Team Channel Manager
 * Creates and manages team-specific private channels in Discord
 */

import { Client, ChannelType, PermissionFlagsBits, CategoryChannel, TextChannel, Role } from 'discord.js';
import { validateTeamName } from './team-validator.js';

// Configuration
const TEAM_CHANNELS_CATEGORY_NAME = 'Team Channels';
const GUILD_ID = '860782751656837140';

// All 28 teams
const ALL_TEAMS = [
  'Bucks', 'Bulls', 'Cavaliers', 'Celtics', 'Grizzlies', 'Hawks', 'Heat', 'Hornets',
  'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic', 'Mavs', 'Nets', 'Nuggets',
  'Pacers', 'Pelicans', 'Pistons', 'Raptors', 'Rockets', 'Sixers', 'Spurs',
  'Suns', 'Timberwolves', 'Trail Blazers', 'Warriors', 'Wizards'
];

/**
 * Get channel name from team name
 */
function getChannelName(teamName: string): string {
  return `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Get or create the Team Channels category
 */
async function getOrCreateCategory(guild: any): Promise<CategoryChannel | null> {
  try {
    // Find existing category
    let category = guild.channels.cache.find(
      (c: any) => c.type === ChannelType.GuildCategory && c.name === TEAM_CHANNELS_CATEGORY_NAME
    );

    if (!category) {
      // Create new category
      category = await guild.channels.create({
        name: TEAM_CHANNELS_CATEGORY_NAME,
        type: ChannelType.GuildCategory,
        reason: 'Team-specific private channels',
      });
      console.log(`[Team Channels] Created category: ${TEAM_CHANNELS_CATEGORY_NAME}`);
    }

    return category;
  } catch (error) {
    console.error('[Team Channels] Error creating category:', error);
    return null;
  }
}

/**
 * Create or update a team channel with proper permissions
 */
async function createOrUpdateTeamChannel(
  guild: any,
  teamName: string,
  teamRole: Role,
  category: CategoryChannel
): Promise<TextChannel | null> {
  try {
    const channelName = getChannelName(teamName);

    // Check if channel already exists
    let channel: TextChannel | null = guild.channels.cache.find(
      (c: any) => c.type === ChannelType.GuildText && c.name === channelName
    ) as TextChannel || null;

    if (!channel) {
      // Create new channel
      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        topic: `Private channel for ${teamName} team members`,
        reason: `Team channel for ${teamName}`,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone role
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: teamRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
        ],
      });
      console.log(`[Team Channels] Created channel: ${channelName}`);
    } else {
      // Update existing channel permissions
      await channel.permissionOverwrites.set([
        {
          id: guild.id, // @everyone role
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: teamRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
      ]);

      // Move to category if not already there
      if (channel.parentId !== category.id) {
        await channel.setParent(category.id);
      }

      console.log(`[Team Channels] Updated channel: ${channelName}`);
    }

    return channel;
  } catch (error) {
    console.error(`[Team Channels] Error creating/updating channel for ${teamName}:`, error);
    return null;
  }
}

/**
 * Sync all team channels
 */
export async function syncTeamChannels(client: Client): Promise<void> {
  try {
    console.log('[Team Channels] Starting channel sync...');

    // Get guild
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      console.error('[Team Channels] Guild not found');
      return;
    }

    // Get or create category
    const category = await getOrCreateCategory(guild);
    if (!category) {
      console.error('[Team Channels] Failed to create category');
      return;
    }

    // Process each team in alphabetical order
    let successCount = 0;
    let failCount = 0;
    
    const sortedTeams = [...ALL_TEAMS].sort();

    for (let i = 0; i < sortedTeams.length; i++) {
      const teamName = sortedTeams[i];
      try {
        // Get team role
        const role = guild.roles.cache.find((r: Role) => r.name === teamName);
        if (!role) {
          console.warn(`[Team Channels] Role not found for ${teamName}, skipping channel creation`);
          failCount++;
          continue;
        }

        // Create or update channel
        const channel = await createOrUpdateTeamChannel(guild, teamName, role, category);
        if (channel) {
          // Set channel position based on alphabetical order
          await channel.setPosition(i);
          successCount++;
        } else {
          failCount++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[Team Channels] Error processing ${teamName}:`, error);
        failCount++;
      }
    }

    console.log(`[Team Channels] Sync complete: ${successCount} channels created/updated, ${failCount} failed`);
  } catch (error) {
    console.error('[Team Channels] Error syncing team channels:', error);
  }
}

/**
 * Initialize team channel manager
 */
export function initializeTeamChannelManager(client: Client): void {
  console.log('[Team Channels] Initializing team channel manager...');

  // Sync channels on bot startup (after a delay to ensure roles are created first)
  client.once('ready', async () => {
    console.log('[Team Channels] Bot ready, scheduling channel sync...');
    // Wait 5 seconds to ensure team roles are created first
    setTimeout(async () => {
      await syncTeamChannels(client);
    }, 5000);
  });

  console.log('[Team Channels] Team channel manager initialized');
}
