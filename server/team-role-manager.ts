/**
 * Team Role Manager
 * Monitors a specific Discord message for team affiliations and automatically assigns roles
 */

import { Client, Message, TextChannel, Role } from 'discord.js';
import { validateTeamName } from './team-validator.js';

// Configuration
const TEAM_MESSAGE_ID = '1130885281508233316';
const TEAM_CHANNEL_ID = '860782989280935966';

// Team colors mapping (hex format for Discord roles)
const TEAM_COLORS: Record<string, number> = {
  'Celtics': 0x007A33,
  'Nets': 0x000000,
  'Knicks': 0x006BB6,
  'Sixers': 0x006BB6,
  'Raptors': 0xCE1141,
  'Bulls': 0xCE1141,
  'Cavaliers': 0x860038,
  'Pistons': 0xC8102E,
  'Pacers': 0x002D62,
  'Bucks': 0x00471B,
  'Hawks': 0xE03A3E,
  'Hornets': 0x1D1160,
  'Heat': 0x98002E,
  'Magic': 0x0077C0,
  'Wizards': 0x002B5C,
  'Nuggets': 0x0E2240,
  'Timberwolves': 0x0C2340,
  'Trail Blazers': 0xE03A3E,
  'Jazz': 0x002B5C,
  'Warriors': 0x1D428A,
  'Lakers': 0x552583,
  'Suns': 0x1D1160,
  'Kings': 0x5A2D81,
  'Mavs': 0x00538C,
  'Rockets': 0xCE1141,
  'Grizzlies': 0x5D76A9,
  'Pelicans': 0x0C2340,
  'Spurs': 0xC4CED4,
};

interface TeamAssignment {
  teamName: string;
  userId: string;
}

/**
 * Parse team assignments from message content
 * Format: "TeamName - <@userId>"
 */
function parseTeamAssignments(content: string): TeamAssignment[] {
  const assignments: TeamAssignment[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match pattern: "TeamName - <@userId>" or "TeamName -  <@userId>"
    const match = line.match(/^([A-Za-z0-9\s]+)\s*-\s*<@(\d+)>/);
    if (match) {
      const rawTeamName = match[1].trim();
      const userId = match[2];
      
      // Validate and normalize team name
      const teamName = validateTeamName(rawTeamName);
      if (teamName && teamName !== 'Free Agents') {
        assignments.push({ teamName, userId });
      }
    }
  }
  
  return assignments;
}

/**
 * Get or create a team role
 */
async function getOrCreateTeamRole(
  guild: any,
  teamName: string
): Promise<Role | null> {
  try {
    // Check if role already exists
    let role = guild.roles.cache.find((r: Role) => r.name === teamName);
    
    if (!role) {
      // Create new role with team colors
      const color = TEAM_COLORS[teamName] || 0x1e293b;
      role = await guild.roles.create({
        name: teamName,
        color,
        hoist: true, // Display role members separately in member list
        reason: 'Auto-created team role',
        mentionable: true,
      });
      console.log(`[Team Roles] Created role: ${teamName}`);
    } else if (!role.hoist) {
      // Update existing role to enable hoisting
      await role.edit({
        hoist: true,
        reason: 'Enable role hoisting for member list display',
      });
      console.log(`[Team Roles] Updated role ${teamName} to enable hoisting`);
    }
    
    return role;
  } catch (error) {
    console.error(`[Team Roles] Error creating role for ${teamName}:`, error);
    return null;
  }
}

/**
 * Sync team roles based on message content
 */
export async function syncTeamRoles(client: Client): Promise<void> {
  try {
    console.log('[Team Roles] Starting role sync...');
    
    // Fetch the team message
    const channel = await client.channels.fetch(TEAM_CHANNEL_ID) as TextChannel;
    if (!channel) {
      console.error('[Team Roles] Channel not found');
      return;
    }
    
    const message = await channel.messages.fetch(TEAM_MESSAGE_ID);
    if (!message) {
      console.error('[Team Roles] Message not found');
      return;
    }
    
    const guild = message.guild;
    if (!guild) {
      console.error('[Team Roles] Guild not found');
      return;
    }
    
    // Parse team assignments
    const assignments = parseTeamAssignments(message.content);
    console.log(`[Team Roles] Found ${assignments.length} team assignments`);
    
    // Track all team roles for cleanup
    const activeTeamRoles = new Set<string>();
    
    // Process each assignment
    for (const { teamName, userId } of assignments) {
      activeTeamRoles.add(teamName);
      
      try {
        // Get or create role
        const role = await getOrCreateTeamRole(guild, teamName);
        if (!role) continue;
        
        // Get member
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          console.warn(`[Team Roles] Member ${userId} not found for team ${teamName}`);
          continue;
        }
        
        // Check if this is a new role assignment (user didn't have the role before)
        const isNewAssignment = !member.roles.cache.has(role.id);
        
        // Assign role if not already assigned
        if (isNewAssignment) {
          await member.roles.add(role);
          console.log(`[Team Roles] Assigned ${teamName} role to ${member.user.tag}`);
          
          // Post welcome message to team channel for new assignments
          try {
            const { postWelcomeMessage } = await import('./team-welcome-message');
            await postWelcomeMessage(client, teamName, userId, member.user.username);
          } catch (error) {
            console.error(`[Team Roles] Error posting welcome message for ${teamName}:`, error);
          }
        }
        
        // Remove other team roles from this member
        const otherTeamRoles = member.roles.cache.filter(
          (r: Role) => r.name !== teamName && TEAM_COLORS[r.name] !== undefined
        );
        
        const otherRolesArray = Array.from(otherTeamRoles.values());
        for (const otherRole of otherRolesArray) {
          await member.roles.remove(otherRole);
          console.log(`[Team Roles] Removed ${otherRole.name} role from ${member.user.tag}`);
        }
      } catch (error) {
        console.error(`[Team Roles] Error processing ${teamName} for user ${userId}:`, error);
      }
    }
    
    console.log('[Team Roles] Role sync complete');
  } catch (error) {
    console.error('[Team Roles] Error syncing team roles:', error);
  }
}

/**
 * Initialize team role monitoring
 */
export function initializeTeamRoleManager(client: Client): void {
  console.log('[Team Roles] Initializing team role manager...');
  
  // Sync roles on bot startup
  client.once('ready', async () => {
    console.log('[Team Roles] Bot ready, performing initial role sync...');
    await syncTeamRoles(client);
  });
  
  // Monitor message updates
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.id === TEAM_MESSAGE_ID && newMessage.channelId === TEAM_CHANNEL_ID) {
      console.log('[Team Roles] Team message updated, syncing roles...');
      await syncTeamRoles(client);
    }
  });
  
  console.log('[Team Roles] Team role manager initialized');
}

/**
 * Manual sync command handler
 */
export async function handleSyncCommand(message: Message): Promise<void> {
  if (message.content.toLowerCase() === '!sync-team-roles') {
    await message.reply('🔄 Syncing team roles...');
    await syncTeamRoles(message.client);
    await message.reply('✅ Team roles synced successfully!');
  }
}
