/**
 * Team Role Logger
 * Tracks when users gain or lose team roles in Discord
 */

import { GuildMember, PartialGuildMember, Client } from 'discord.js';
import { getDb } from './db.js';
import { teamRoleChanges } from '../drizzle/schema.js';

// List of all team names (matching team-channel-manager.ts)
const TEAM_NAMES = [
  'Bucks', 'Bulls', 'Cavaliers', 'Celtics', 'Clippers', 'Grizzlies', 'Hawks',
  'Heat', 'Hornets', 'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic', 'Mavs',
  'Nets', 'Nuggets', 'Pacers', 'Pelicans', 'Pistons', 'Raptors', 'Rockets',
  'Sixers', 'Spurs', 'Suns', 'Timberwolves', 'Trail Blazers', 'Warriors', 'Wizards'
];

/**
 * Check if a role name corresponds to a team role
 */
function isTeamRole(roleName: string): boolean {
  return TEAM_NAMES.includes(roleName);
}

/**
 * Log team role changes when a member's roles are updated
 */
export async function logTeamRoleChange(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember | PartialGuildMember,
  client?: Client
): Promise<void> {
  try {
    // Get old and new role names
    const oldRoles = oldMember.roles.cache.map(role => role.name);
    const newRoles = newMember.roles.cache.map(role => role.name);

    // Find team roles that were added
    const addedRoles = newRoles.filter(role => !oldRoles.includes(role) && isTeamRole(role));
    
    // Find team roles that were removed
    const removedRoles = oldRoles.filter(role => !newRoles.includes(role) && isTeamRole(role));

    // If no team role changes, return early
    if (addedRoles.length === 0 && removedRoles.length === 0) {
      return;
    }

    const db = await getDb();
    if (!db) {
      console.error('[Team Role Logger] Database not available');
      return;
    }

    const userId = newMember.id;
    const username = newMember.user.tag; // username#discriminator

    // Log added roles
    for (const teamName of addedRoles) {
      await db.insert(teamRoleChanges).values({
        discordUserId: userId,
        discordUsername: username,
        teamName,
        action: 'added',
      });
      console.log(`[Team Role Logger] ✅ ${username} gained ${teamName} role`);
      
      // Post welcome message to team channel
      if (client) {
        try {
          const { postWelcomeMessage } = await import('./team-welcome-message.js');
          await postWelcomeMessage(client, teamName, userId, username);
        } catch (error) {
          console.error(`[Team Role Logger] Failed to post welcome message for ${teamName}:`, error);
        }
      }
    }

    // Log removed roles
    for (const teamName of removedRoles) {
      await db.insert(teamRoleChanges).values({
        discordUserId: userId,
        discordUsername: username,
        teamName,
        action: 'removed',
      });
      console.log(`[Team Role Logger] ❌ ${username} lost ${teamName} role`);
    }
  } catch (error) {
    console.error('[Team Role Logger] Error logging role change:', error);
  }
}
