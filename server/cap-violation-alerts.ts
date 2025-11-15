import { Client, EmbedBuilder } from 'discord.js';
import { getDb } from './db';
import { players } from '../drizzle/schema';
import { and, isNotNull, ne, eq } from 'drizzle-orm';

const OVERALL_CAP_LIMIT = 1098;

interface TeamCapStatus {
  team: string;
  totalOverall: number;
  playerCount: number;
  overCap: number;
  players: Array<{ name: string; overall: number }>;
}

/**
 * Get cap status for all teams
 */
async function getTeamCapStatuses(): Promise<TeamCapStatus[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select()
    .from(players)
    .where(
      and(
        isNotNull(players.team),
        ne(players.team, 'Free Agents'),
        ne(players.team, 'Free Agent')
      )
    );
  
  const teamData = new Map<string, { totalOverall: number; playerCount: number; players: Array<{ name: string; overall: number }> }>();
  
  result.forEach((player) => {
    const team = player.team!;
    const current = teamData.get(team) || { totalOverall: 0, playerCount: 0, players: [] };
    teamData.set(team, {
      totalOverall: current.totalOverall + player.overall,
      playerCount: current.playerCount + 1,
      players: [...current.players, { name: player.name, overall: player.overall }]
    });
  });
  
  return Array.from(teamData.entries()).map(([team, data]) => ({
    team,
    totalOverall: data.totalOverall,
    playerCount: data.playerCount,
    overCap: data.totalOverall - OVERALL_CAP_LIMIT,
    players: data.players.sort((a, b) => a.overall - b.overall) // Sort by overall ascending (lowest first)
  }));
}

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
 * Get Discord user ID for a team owner
 */
function getTeamOwnerDiscordId(teamName: string): string | null {
  return TEAM_TO_DISCORD_USER[teamName] || null;
}

/**
 * Send cap violation alert to team owner
 */
async function sendCapViolationAlert(
  client: Client,
  teamStatus: TeamCapStatus
): Promise<void> {
  try {
    const ownerId = getTeamOwnerDiscordId(teamStatus.team);
    if (!ownerId) {
      console.log(`[Cap Alerts] No owner found for ${teamStatus.team}`);
      return;
    }
    
    // Fetch user
    const user = await client.users.fetch(ownerId);
    if (!user) {
      console.log(`[Cap Alerts] Could not fetch user ${ownerId}`);
      return;
    }
    
    // Suggest players to drop (lowest overall players)
    const suggestedDrops = teamStatus.players.slice(0, 3).map(p => 
      `• ${p.name} (${p.overall} OVR)`
    ).join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle('🚨 Cap Violation Alert')
      .setDescription(
        `Your team **${teamStatus.team}** is currently **over the cap limit**!\n\n` +
        `**Current Total:** ${teamStatus.totalOverall} OVR\n` +
        `**Cap Limit:** ${OVERALL_CAP_LIMIT} OVR\n` +
        `**Over by:** ${teamStatus.overCap} OVR\n` +
        `**Roster Size:** ${teamStatus.playerCount}/14 players`
      )
      .setColor(0xef4444) // Red
      .addFields({
        name: '💡 Suggested Players to Drop',
        value: suggestedDrops || 'No suggestions available',
        inline: false
      })
      .setFooter({ text: 'Please adjust your roster to comply with the cap limit' })
      .setTimestamp();
    
    await user.send({ embeds: [embed] });
    console.log(`[Cap Alerts] Sent cap violation alert to ${user.tag} for ${teamStatus.team}`);
    
  } catch (error) {
    console.error(`[Cap Alerts] Error sending alert for ${teamStatus.team}:`, error);
  }
}

/**
 * Check all teams for cap violations and send alerts
 */
export async function checkCapViolations(client: Client): Promise<void> {
  try {
    console.log('[Cap Alerts] Checking for cap violations...');
    
    const teamStatuses = await getTeamCapStatuses();
    const violatingTeams = teamStatuses.filter(t => t.overCap > 0);
    
    if (violatingTeams.length === 0) {
      console.log('[Cap Alerts] No cap violations found');
      return;
    }
    
    console.log(`[Cap Alerts] Found ${violatingTeams.length} teams over cap`);
    
    for (const team of violatingTeams) {
      await sendCapViolationAlert(client, team);
      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('[Cap Alerts] Cap violation alerts sent');
    
  } catch (error) {
    console.error('[Cap Alerts] Error checking cap violations:', error);
  }
}

/**
 * Initialize cap violation monitoring
 * Checks every 6 hours
 */
export function initializeCapViolationMonitoring(client: Client): void {
  console.log('[Cap Alerts] Initializing cap violation monitoring...');
  
  // Check immediately on startup
  setTimeout(() => {
    checkCapViolations(client);
  }, 5000); // Wait 5 seconds after bot starts
  
  // Then check every 6 hours
  setInterval(() => {
    checkCapViolations(client);
  }, 6 * 60 * 60 * 1000); // 6 hours
  
  console.log('[Cap Alerts] Cap violation monitoring initialized (checks every 6 hours)');
}
