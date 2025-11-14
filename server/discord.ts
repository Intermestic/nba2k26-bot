import { getDb } from "./db";
import { players, discordConfig } from "../drizzle/schema";
import { ne, and, isNotNull, eq } from "drizzle-orm";

const OVERALL_CAP_LIMIT = 1098;

interface TeamSummary {
  team: string;
  playerCount: number;
  totalOverall: number;
}

export async function getTeamSummaries(): Promise<TeamSummary[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select()
    .from(players)
    .where(
      and(
        isNotNull(players.team),
        ne(players.team, 'Free Agents')
      )
    );
  
  const summaries = new Map<string, { playerCount: number; totalOverall: number }>();
  
  result.forEach((player) => {
    const team = player.team!;
    const current = summaries.get(team) || { playerCount: 0, totalOverall: 0 };
    summaries.set(team, {
      playerCount: current.playerCount + 1,
      totalOverall: current.totalOverall + player.overall
    });
  });
  
  return Array.from(summaries.entries())
    .map(([team, data]) => ({ team, ...data }))
    .sort((a, b) => {
      // Sort by over-cap amount (descending), then by team name
      const aOverCap = Math.max(0, a.totalOverall - OVERALL_CAP_LIMIT);
      const bOverCap = Math.max(0, b.totalOverall - OVERALL_CAP_LIMIT);
      if (aOverCap !== bOverCap) return bOverCap - aOverCap;
      return a.team.localeCompare(b.team);
    });
}

// Team logo mapping
const teamLogos: Record<string, string> = {
  "Hawks": "https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg",
  "Celtics": "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
  "Nets": "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg",
  "Hornets": "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg",
  "Bulls": "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg",
  "Cavaliers": "https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg",
  "Mavericks": "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg",
  "Nuggets": "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg",
  "Pistons": "https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg",
  "Warriors": "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
  "Rockets": "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg",
  "Pacers": "https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg",
  "Clippers": "https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg",
  "Lakers": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
  "Grizzlies": "https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg",
  "Heat": "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg",
  "Bucks": "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg",
  "Timberwolves": "https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg",
  "Pelicans": "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg",
  "Knicks": "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg",
  "Thunder": "https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg",
  "Magic": "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg",
  "Sixers": "https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg",
  "Suns": "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
  "Trail Blazers": "https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg",
  "Kings": "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg",
  "Spurs": "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg",
  "Raptors": "https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg",
  "Jazz": "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg",
  "Wizards": "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg"
};

export function generateDiscordEmbed(summaries: TeamSummary[], websiteUrl: string) {
  const overCapTeams = summaries.filter(s => s.totalOverall > OVERALL_CAP_LIMIT).length;
  
  // Build team list with plain text (no markdown to avoid syntax errors)
  const teamLines = summaries.map(summary => {
    const overCap = summary.totalOverall - OVERALL_CAP_LIMIT;
    const status = overCap > 0 
      ? `🔴 ${summary.totalOverall} (+${overCap})`
      : `${summary.totalOverall}`;
    
    // Simple format: Team (count/14) - status
    return `${summary.team} (${summary.playerCount}/14) - ${status}`;
  });
  
  const description = `**Cap Limit:** ${OVERALL_CAP_LIMIT} Total Overall\n🔴 Over Cap: ${overCapTeams} teams\n\n${teamLines.join('\n')}\n\n**View rosters:** tinyurl.com/hof2k`;
  
  return {
    embeds: [{
      title: "🏀 NBA 2K26 Team Cap Status",
      description: description,
      color: overCapTeams > 0 ? 0xef4444 : 0x3b82f6, // Red if over cap, blue otherwise
      url: websiteUrl, // Makes the title clickable
      thumbnail: {
        url: "https://cdn.nba.com/logos/leagues/logo-nba.svg"
      },
      footer: {
        text: `Last updated: ${new Date().toLocaleString()}`
      },
      timestamp: new Date().toISOString()
    }]
  };
}

export async function postToDiscord(webhookUrl: string, websiteUrl: string) {
  const summaries = await getTeamSummaries();
  const embed = generateDiscordEmbed(summaries, websiteUrl);
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(embed)
  });
  
  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
  }
  
  return { success: true, teamCount: summaries.length };
}

export async function updateDiscordMessage(webhookUrl: string, messageId: string, websiteUrl: string) {
  const summaries = await getTeamSummaries();
  const embed = generateDiscordEmbed(summaries, websiteUrl);
  
  // Extract webhook ID and token from URL
  const match = webhookUrl.match(/discord\.com\/api\/webhooks\/(\d+)\/([^/]+)/);
  if (!match) {
    throw new Error('Invalid Discord webhook URL');
  }
  
  const [, webhookId, webhookToken] = match;
  const editUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`;
  
  const response = await fetch(editUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(embed)
  });
  
  if (!response.ok) {
    throw new Error(`Discord message update failed: ${response.status} ${response.statusText}`);
  }
  
  return { success: true, teamCount: summaries.length };
}

// Track teams affected by recent transactions for notifications
let recentlyAffectedTeams = new Set<string>();
let notificationTimeout: NodeJS.Timeout | null = null;

// Auto-update Discord message if enabled
export async function autoUpdateDiscord(affectedTeams?: string[]) {
  try {
    const db = await getDb();
    if (!db) return;

    const configs = await db.select().from(discordConfig).limit(1);
    if (configs.length === 0) return;

    const config = configs[0];
    
    // Check if auto-update is enabled and we have necessary config
    if (!config.autoUpdateEnabled || !config.webhookUrl || !config.messageId) {
      return;
    }

    // Track affected teams for notification
    if (affectedTeams && affectedTeams.length > 0) {
      affectedTeams.forEach(team => recentlyAffectedTeams.add(team));
      
      // Clear existing timeout
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
      
      // Set timeout to send notification after 2 seconds (to batch multiple updates)
      notificationTimeout = setTimeout(async () => {
        if (recentlyAffectedTeams.size >= 2) {
          try {
            await sendBulkUpdateNotification(config.webhookUrl, Array.from(recentlyAffectedTeams));
          } catch (err) {
            console.error('[Discord] Notification failed:', err);
          }
        }
        recentlyAffectedTeams.clear();
        notificationTimeout = null;
      }, 2000);
    }

    // Rate limiting: don't update if last update was less than 1 minute ago
    if (config.lastUpdated) {
      const timeSinceLastUpdate = Date.now() - config.lastUpdated.getTime();
      if (timeSinceLastUpdate < 60000) { // 60 seconds
        console.log('[Discord] Skipping auto-update due to rate limit');
        return;
      }
    }

    // Update Discord message
    await updateDiscordMessage(config.webhookUrl, config.messageId, config.websiteUrl);
    
    // Update lastUpdated timestamp
    await db
      .update(discordConfig)
      .set({ lastUpdated: new Date() })
      .where(eq(discordConfig.id, config.id));

    console.log('[Discord] Auto-update successful');
  } catch (error) {
    console.error('[Discord] Auto-update failed:', error);
  }
}

// Send notification when 2+ teams are updated
async function sendBulkUpdateNotification(webhookUrl: string, teams: string[]) {
  const teamList = teams.map(t => `**${t}**`).join(', ');
  const message = {
    content: `🚨 **Bulk Transaction Alert** 🚨\n\n${teams.length} teams updated: ${teamList}\n\nCap status has been updated automatically.`
  };
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message)
  });
  
  if (!response.ok) {
    throw new Error(`Discord notification failed: ${response.status} ${response.statusText}`);
  }
  
  console.log(`[Discord] Sent bulk update notification for ${teams.length} teams`);
}


export async function postTeamToDiscord(webhookUrl: string, teamName: string, websiteUrl: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Get all players for the specific team
  const teamPlayers = await db
    .select()
    .from(players)
    .where(eq(players.team, teamName));
  
  if (teamPlayers.length === 0) {
    throw new Error(`Team "${teamName}" not found or has no players`);
  }
  
  const totalOverall = teamPlayers.reduce((sum: number, p: any) => sum + p.overall, 0);
  const overCap = totalOverall - OVERALL_CAP_LIMIT;
  const status = overCap > 0 
    ? `🔴 ${totalOverall} (+${overCap})`
    : overCap === 0
    ? `🟡 ${totalOverall}`
    : `🟢 ${totalOverall}`;
  
  // Sort players by overall rating
  const sortedPlayers = teamPlayers.sort((a: any, b: any) => b.overall - a.overall);
  
  // Build player list
  const playerLines = sortedPlayers.map((p: any, idx: number) => 
    `${idx + 1}. **${p.name}** - ${p.overall} OVR`
  );
  
  const teamUrl = `${websiteUrl}?team=${encodeURIComponent(teamName)}`;
  const description = `**${teamName}** (${teamPlayers.length}/14 players)\n${status}\n\n${playerLines.join('\n')}\n\n[View Team →](<${teamUrl}>)`;
  
  const embed = {
    embeds: [{
      title: `🏀 ${teamName} Cap Status`,
      description: description,
      color: overCap > 0 ? 0xef4444 : overCap === 0 ? 0xeab308 : 0x10b981,
      footer: {
        text: `Cap Limit: ${OVERALL_CAP_LIMIT} Total Overall`
      },
      timestamp: new Date().toISOString()
    }]
  };
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(embed)
  });
  
  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
  }
  
  return { success: true, teamName, playerCount: teamPlayers.length, totalOverall };
}
