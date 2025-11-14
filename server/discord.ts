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

export function generateDiscordEmbed(summaries: TeamSummary[], websiteUrl: string) {
  const overCapTeams = summaries.filter(s => s.totalOverall > OVERALL_CAP_LIMIT).length;
  const atCapTeams = summaries.filter(s => s.totalOverall === OVERALL_CAP_LIMIT).length;
  const underCapTeams = summaries.filter(s => s.totalOverall < OVERALL_CAP_LIMIT).length;
  
  // Build team list as description (Discord has 25 field limit, we have 28 teams)
  const teamLines = summaries.map(summary => {
    const overCap = summary.totalOverall - OVERALL_CAP_LIMIT;
    const status = overCap > 0 
      ? `🔴 ${summary.totalOverall} (+${overCap})`
      : overCap === 0
      ? `🟡 ${summary.totalOverall}`
      : `🟢 ${summary.totalOverall}`;
    
    const teamUrl = `${websiteUrl}?team=${encodeURIComponent(summary.team)}`;
    // Use angle bracket format for URLs to avoid markdown parsing issues with spaces
    return `**${summary.team}** (${summary.playerCount}/14) - ${status} [→](<${teamUrl}>)`;
  });
  
  const description = `**Cap Limit:** ${OVERALL_CAP_LIMIT} Total Overall\n🔴 Over: ${overCapTeams}\n\n${teamLines.join('\n')}`;
  
  return {
    embeds: [{
      title: "🏀 NBA 2K26 Team Cap Status",
      description: description,
      color: overCapTeams > 0 ? 0xef4444 : atCapTeams > 0 ? 0xeab308 : 0x10b981,
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

// Auto-update Discord message if enabled
export async function autoUpdateDiscord() {
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
