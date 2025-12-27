import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { players, teamAssignments, tradeLogs } from "../../drizzle/schema";
import { VALID_TEAMS } from "../team-validator";
import axios from "axios";
import * as cheerio from "cheerio";

const TRADE_CHANNEL_ID = "1336156955722645535";

/**
 * Scrape badge count from 2kratings.com player page
 */
async function scrapeBadgeCount(playerName: string, playerPageUrl: string | null): Promise<number> {
  try {
    // If we have a direct URL, use it
    if (playerPageUrl && playerPageUrl.includes('2kratings.com')) {
      const response = await axios.get(playerPageUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Try to find badge count on the page
      // Common patterns: "X Badges", badge counter, etc.
      const badgeText = $('body').text();
      const badgeMatch = badgeText.match(/(\d+)\s*(?:Badge|badge)/i);
      
      if (badgeMatch) {
        return parseInt(badgeMatch[1], 10);
      }
    }
    
    // Fallback: construct URL from player name
    const urlName = playerName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-');
    
    const url = `https://www.2kratings.com/${urlName}`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const badgeText = $('body').text();
    const badgeMatch = badgeText.match(/(\d+)\s*(?:Badge|badge)/i);
    
    if (badgeMatch) {
      return parseInt(badgeMatch[1], 10);
    }
    
    console.warn(`[Trade Machine] Could not find badge count for ${playerName}`);
    return 0;
  } catch (error) {
    console.error(`[Trade Machine] Error scraping badges for ${playerName}:`, error);
    return 0;
  }
}

/**
 * Post message to Discord channel using Discord API directly
 * This works from both sandbox and published environments
 */
async function postToDiscordChannel(channelId: string, content: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  
  if (!botToken) {
    return { success: false, error: 'Discord bot token not configured' };
  }
  
  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Trade Machine] Discord API error:', response.status, errorData);
      return { 
        success: false, 
        error: `Discord API error: ${response.status} - ${errorData.message || 'Unknown error'}` 
      };
    }
    
    const data = await response.json();
    console.log(`[Trade Machine] Message posted to Discord channel ${channelId}, message ID: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[Trade Machine] Error posting to Discord:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export const tradeMachineRouter = router({
  /**
   * Get team owners from team assignments
   */
  getTeamOwners: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const owners = await db
      .select({
        discordUserId: teamAssignments.discordUserId,
        discordUsername: teamAssignments.discordUsername,
        team: teamAssignments.team,
      })
      .from(teamAssignments);

    return owners;
  }),

  /**
   * Get all tradable teams (28 NBA teams, excluding Free Agents)
   */
  getTradableTeams: publicProcedure.query(async () => {
    const teams = VALID_TEAMS.filter(team => team !== "Free Agents");
    return teams.sort();
  }),

  /**
   * Get roster for a specific team
   */
  getTeamRoster: publicProcedure
    .input(z.object({
      teamName: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const roster = await db
        .select({
          id: players.id,
          name: players.name,
          overall: players.overall,
          team: players.team,
          photoUrl: players.photoUrl,
          playerPageUrl: players.playerPageUrl,
        })
        .from(players)
        .where(eq(players.team, input.teamName))
        .orderBy(players.overall);

      return roster;
    }),

  /**
   * Scrape badge counts for selected players
   */
  scrapeBadgeCounts: publicProcedure
    .input(z.object({
      playerIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const playerData = await db
        .select({
          id: players.id,
          name: players.name,
          playerPageUrl: players.playerPageUrl,
        })
        .from(players)
        .where(inArray(players.id, input.playerIds));

      const results = await Promise.all(
        playerData.map(async (player) => {
          const badgeCount = await scrapeBadgeCount(player.name, player.playerPageUrl);
          return {
            playerId: player.id,
            playerName: player.name,
            badgeCount,
          };
        })
      );

      return results;
    }),

  /**
   * Post formatted trade to Discord
   * Uses Discord API directly instead of bot HTTP endpoint for reliability
   */
  postTradeToDiscord: publicProcedure
    .input(z.object({
      team1Name: z.string(),
      team1Players: z.array(z.object({
        name: z.string(),
        overall: z.number(),
        badges: z.number(),
      })),
      team2Name: z.string(),
      team2Players: z.array(z.object({
        name: z.string(),
        overall: z.number(),
        badges: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Trade Machine] Posting trade: ${input.team1Name} ↔ ${input.team2Name}`);
        
        // Calculate totals
        const team1TotalOvr = input.team1Players.reduce((sum, p) => sum + p.overall, 0);
        const team1TotalBadges = input.team1Players.reduce((sum, p) => sum + p.badges, 0);
        const team2TotalOvr = input.team2Players.reduce((sum, p) => sum + p.overall, 0);
        const team2TotalBadges = input.team2Players.reduce((sum, p) => sum + p.badges, 0);
        
        // Format trade message
        const lines: string[] = [];
        
        lines.push(`**${input.team1Name} Sends:**`);
        lines.push('');
        input.team1Players.forEach((player) => {
          lines.push(`${player.name} ${player.overall} (${player.badges})`);
        });
        lines.push('--');
        lines.push(`${team1TotalOvr} (${team1TotalBadges})`);
        lines.push('');
        
        lines.push(`**${input.team2Name} Sends:**`);
        lines.push('');
        input.team2Players.forEach((player) => {
          lines.push(`${player.name} ${player.overall} (${player.badges})`);
        });
        lines.push('--');
        lines.push(`${team2TotalOvr} (${team2TotalBadges})`);
        
        const message = lines.join('\n');
        
        // Post directly to Discord using the API
        const result = await postToDiscordChannel(TRADE_CHANNEL_ID, message);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to post to Discord');
        }
        
        console.log(`[Trade Machine] Trade posted successfully: ${input.team1Name} ↔ ${input.team2Name}`);
        
        // Save trade to database for admin review (non-blocking)
        try {
          const db = await getDb();
          if (db) {
            const playerBadgesMap: Record<string, number> = {};
            input.team1Players.forEach((p) => {
              playerBadgesMap[p.name] = p.badges;
            });
            input.team2Players.forEach((p) => {
              playerBadgesMap[p.name] = p.badges;
            });
            
            await db.insert(tradeLogs).values({
              team1: input.team1Name,
              team2: input.team2Name,
              team1Players: JSON.stringify(input.team1Players),
              team2Players: JSON.stringify(input.team2Players),
              playerBadges: JSON.stringify(playerBadgesMap),
              status: "pending",
              submittedBy: "Trade Machine",
            });
            
            console.log(`[Trade Machine] Saved trade to database for review`);
          }
        } catch (dbError) {
          console.error(`[Trade Machine] Failed to save trade to database (non-critical):`, dbError);
          // Don't fail the request - Discord post was successful
        }
        
        return {
          success: true,
          message: "Trade posted to Discord successfully",
        };
      } catch (error) {
        console.error("[Trade Machine] Error posting trade to Discord:", error);
        throw new Error(`Failed to post trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Send trade offer DM to team owners
   * Uses Discord API directly instead of bot client
   */
  sendTradeDM: publicProcedure
    .input(z.object({
      team1Name: z.string(),
      team1Players: z.array(z.object({
        name: z.string(),
        overall: z.number(),
        badges: z.number(),
      })),
      team2Name: z.string(),
      team2Players: z.array(z.object({
        name: z.string(),
        overall: z.number(),
        badges: z.number(),
      })),
      team1UserId: z.string(),
      team2UserId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const botToken = process.env.DISCORD_BOT_TOKEN;
      
      if (!botToken) {
        throw new Error("Discord bot token not configured");
      }
      
      try {
        // Calculate totals
        const team1TotalOvr = input.team1Players.reduce((sum, p) => sum + p.overall, 0);
        const team1TotalBadges = input.team1Players.reduce((sum, p) => sum + p.badges, 0);
        const team2TotalOvr = input.team2Players.reduce((sum, p) => sum + p.overall, 0);
        const team2TotalBadges = input.team2Players.reduce((sum, p) => sum + p.badges, 0);

        // Format DM message for team 1 owner
        const team1Message = [
          `🔄 **Trade Offer**`,
          ``,
          `You (${input.team1Name}) would receive:`,
          ...input.team2Players.map(p => `  • ${p.name} ${p.overall} (${p.badges} badges)`),
          `  **Total: ${team2TotalOvr} OVR (${team2TotalBadges} badges)**`,
          ``,
          `You would send:`,
          ...input.team1Players.map(p => `  • ${p.name} ${p.overall} (${p.badges} badges)`),
          `  **Total: ${team1TotalOvr} OVR (${team1TotalBadges} badges)**`,
          ``,
          `This trade has been posted to the trade channel for voting.`,
        ].join('\n');

        // Format DM message for team 2 owner
        const team2Message = [
          `🔄 **Trade Offer**`,
          ``,
          `You (${input.team2Name}) would receive:`,
          ...input.team1Players.map(p => `  • ${p.name} ${p.overall} (${p.badges} badges)`),
          `  **Total: ${team1TotalOvr} OVR (${team1TotalBadges} badges)**`,
          ``,
          `You would send:`,
          ...input.team2Players.map(p => `  • ${p.name} ${p.overall} (${p.badges} badges)`),
          `  **Total: ${team2TotalOvr} OVR (${team2TotalBadges} badges)**`,
          ``,
          `This trade has been posted to the trade channel for voting.`,
        ].join('\n');

        // Helper function to send DM via Discord API
        const sendDM = async (userId: string, content: string): Promise<{ success: boolean; error?: string }> => {
          try {
            // First, create a DM channel
            const dmChannelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
              method: 'POST',
              headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ recipient_id: userId }),
            });
            
            if (!dmChannelResponse.ok) {
              const error = await dmChannelResponse.json().catch(() => ({}));
              return { success: false, error: `Failed to create DM channel: ${error.message || dmChannelResponse.status}` };
            }
            
            const dmChannel = await dmChannelResponse.json();
            
            // Then send the message
            const messageResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ content }),
            });
            
            if (!messageResponse.ok) {
              const error = await messageResponse.json().catch(() => ({}));
              return { success: false, error: `Failed to send DM: ${error.message || messageResponse.status}` };
            }
            
            return { success: true };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        }

        // Send DMs to both users
        const errors: string[] = [];
        
        const result1 = await sendDM(input.team1UserId, team1Message);
        if (!result1.success) {
          console.error(`[Trade Machine] Failed to send DM to ${input.team1Name} owner:`, result1.error);
          errors.push(`Failed to send DM to ${input.team1Name} owner`);
        } else {
          console.log(`[Trade Machine] Sent DM to ${input.team1Name} owner (${input.team1UserId})`);
        }

        const result2 = await sendDM(input.team2UserId, team2Message);
        if (!result2.success) {
          console.error(`[Trade Machine] Failed to send DM to ${input.team2Name} owner:`, result2.error);
          errors.push(`Failed to send DM to ${input.team2Name} owner`);
        } else {
          console.log(`[Trade Machine] Sent DM to ${input.team2Name} owner (${input.team2UserId})`);
        }

        if (errors.length > 0) {
          throw new Error(errors.join(', '));
        }

        return {
          success: true,
          message: "Trade offers sent via DM",
        };
      } catch (error) {
        console.error("[Trade Machine] Error sending trade DMs:", error);
        throw new Error(`Failed to send DMs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
