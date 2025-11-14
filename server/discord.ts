import { getDb } from "./db";
import { players } from "../drizzle/schema";
import { ne, and, isNotNull } from "drizzle-orm";

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
  const fields = summaries.map(summary => {
    const overCap = summary.totalOverall - OVERALL_CAP_LIMIT;
    const status = overCap > 0 
      ? `🔴 ${summary.totalOverall} (+${overCap})`
      : overCap === 0
      ? `🟡 ${summary.totalOverall}`
      : `🟢 ${summary.totalOverall}`;
    
    const teamUrl = `${websiteUrl}?team=${encodeURIComponent(summary.team)}`;
    
    return {
      name: `${summary.team} (${summary.playerCount}/14)`,
      value: `${status}\n[View Team →](${teamUrl})`,
      inline: true
    };
  });
  
  const overCapTeams = summaries.filter(s => s.totalOverall > OVERALL_CAP_LIMIT).length;
  const atCapTeams = summaries.filter(s => s.totalOverall === OVERALL_CAP_LIMIT).length;
  const underCapTeams = summaries.filter(s => s.totalOverall < OVERALL_CAP_LIMIT).length;
  
  return {
    embeds: [{
      title: "🏀 NBA 2K26 Team Cap Status",
      description: `**Cap Limit:** ${OVERALL_CAP_LIMIT} Total Overall\n\n🔴 Over Cap: ${overCapTeams} | 🟡 At Cap: ${atCapTeams} | 🟢 Under Cap: ${underCapTeams}`,
      color: overCapTeams > 0 ? 0xef4444 : atCapTeams > 0 ? 0xeab308 : 0x10b981,
      fields: fields,
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
