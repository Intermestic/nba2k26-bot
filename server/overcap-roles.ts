import { getDb } from './db';
import { players } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import type { Client, Guild, Role } from 'discord.js';

const OVR_CAP = 1098;
const OVERCAP_ROLE_NAME = 'overcap';

/**
 * Team to Discord user mapping
 * This maps team names to Discord user IDs
 */
const TEAM_TO_DISCORD_USER: Record<string, string> = {
  'Bucks': '294659496247033857',
  'Bulls': '265682789326782465',
  'Suns': '853835596123471883',
  'Cavaliers': '560133436501917726',
  'Celtics': '1090784134416322663',
  'Hawks': '651615180198903822',
  'Heat': '140276921685639168',
  'Hornets': '1188260635734196274',
  'Jazz': '836929618404704316',
  'Pelicans': '609904178994872330',
  'Kings': '675490663348961310',
  'Knicks': '1351006163780501676',
  'Lakers': '764123341816201217',
  'Magic': '1061989363879264326',
  'Mavs': '716585837969801317',
  'Nuggets': '459172069641289739',
  'Nets': '992170912554168440',
  'Raptors': '683053192359182376',
  'Rockets': '786625418396172289',
  'Timberwolves': '1210078581892583445',
  'Trailblazers': '668299741158834237',
  'Spurs': '327661967537864706',
  'Warriors': '1032395638433919017',
  'Wizards': '679275787664359435',
  'Pistons': '1068828938765348904',
  '76ers': '1311886696907931728'
  // Note: Grizzlies and Pacers have no assigned users
};

/**
 * Calculate total OVR for each team based on current rosters
 */
export async function calculateTeamOVRTotals(): Promise<Map<string, number>> {
  const db = await getDb();
  if (!db) return new Map();
  
  try {
    // Get all players grouped by team
    const allPlayers = await db
      .select()
      .from(players)
      .where(sql`${players.team} IS NOT NULL AND ${players.team} != 'Free Agent' AND ${players.team} != 'Free Agents'`);
    
    // Calculate total OVR per team
    const teamTotals = new Map<string, number>();
    
    for (const player of allPlayers) {
      if (!player.team) continue;
      
      const currentTotal = teamTotals.get(player.team) || 0;
      teamTotals.set(player.team, currentTotal + player.overall);
    }
    
    console.log('[Overcap Roles] Team OVR totals calculated:', Object.fromEntries(teamTotals));
    return teamTotals;
  } catch (error) {
    console.error('[Overcap Roles] Error calculating team totals:', error);
    return new Map();
  }
}

/**
 * Get or create the "overcap" role in the guild
 */
async function getOrCreateOvercapRole(guild: Guild): Promise<Role | null> {
  try {
    // Check if role already exists
    let role = guild.roles.cache.find(r => r.name.toLowerCase() === OVERCAP_ROLE_NAME.toLowerCase());
    
    if (!role) {
      // Create the role
      role = await guild.roles.create({
        name: OVERCAP_ROLE_NAME,
        color: 0xFF0000, // Red color
        reason: 'Auto-created for overcap team management'
      });
      console.log('[Overcap Roles] Created "overcap" role');
    }
    
    return role;
  } catch (error) {
    console.error('[Overcap Roles] Error getting/creating overcap role:', error);
    return null;
  }
}

/**
 * Update overcap roles for all teams based on current roster totals
 */
export async function updateOvercapRoles(client: Client): Promise<void> {
  try {
    // Get team OVR totals
    const teamTotals = await calculateTeamOVRTotals();
    
    if (teamTotals.size === 0) {
      console.log('[Overcap Roles] No team data found');
      return;
    }
    
    // Get the guild (assuming bot is only in one guild)
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[Overcap Roles] No guild found');
      return;
    }
    
    // Get or create overcap role
    const overcapRole = await getOrCreateOvercapRole(guild);
    if (!overcapRole) {
      console.error('[Overcap Roles] Failed to get/create overcap role');
      return;
    }
    
    // Process each team (fetch members individually to avoid timeout)
    for (const [teamName, totalOVR] of Array.from(teamTotals.entries())) {
      const isOvercap = totalOVR > OVR_CAP;
      const discordUserId = TEAM_TO_DISCORD_USER[teamName];
      
      if (!discordUserId) {
        console.log(`[Overcap Roles] No Discord user mapping for team: ${teamName}`);
        continue;
      }
      
      try {
        const member = await guild.members.fetch(discordUserId);
        const hasRole = member.roles.cache.has(overcapRole.id);
        
        if (isOvercap && !hasRole) {
          // Add overcap role
          await member.roles.add(overcapRole);
          console.log(`[Overcap Roles] ✅ Added overcap role to ${teamName} (${totalOVR} OVR > ${OVR_CAP})`);
        } else if (!isOvercap && hasRole) {
          // Remove overcap role
          await member.roles.remove(overcapRole);
          console.log(`[Overcap Roles] ✅ Removed overcap role from ${teamName} (${totalOVR} OVR ≤ ${OVR_CAP})`);
        } else {
          console.log(`[Overcap Roles] No change needed for ${teamName} (${totalOVR} OVR, overcap: ${isOvercap})`);
        }
      } catch (error: any) {
        const errorCode = error?.code || error?.status;
        const errorMsg = error?.message || String(error);
        
        // 10007 = Unknown Member (user left server) - skip silently
        if (errorCode === 10007 || errorMsg.includes('Unknown Member')) {
          continue;
        }
        
        // 50013 = Missing Permissions - log but don't crash
        if (errorCode === 50013 || errorMsg.includes('Missing Permissions')) {
          console.warn(`[Overcap Roles] Missing permissions to manage roles for ${teamName}`);
          continue;
        }
        
        // Network/timeout errors - log but continue
        if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNRESET')) {
          console.warn(`[Overcap Roles] Network error updating role for ${teamName}, will retry next cycle`);
          continue;
        }
        
        // All other errors - log and continue
        console.error(`[Overcap Roles] Error updating role for ${teamName}:`, { code: errorCode, message: errorMsg });
      }
    }
    
    console.log('[Overcap Roles] Role update complete');
  } catch (error) {
    console.error('[Overcap Roles] Error updating overcap roles:', error);
  }
}

/**
 * Load team to Discord user mapping from database
 * This should be called on bot startup to populate TEAM_TO_DISCORD_USER
 */
export async function loadTeamUserMapping(): Promise<void> {
  // TODO: Implement this based on your database schema
  // For now, you'll need to manually configure TEAM_TO_DISCORD_USER above
  // or create a new database table to store this mapping
  
  console.log('[Overcap Roles] Team-to-user mapping loaded');
}
