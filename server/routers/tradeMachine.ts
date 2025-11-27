import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { players, teamAssignments } from "../../drizzle/schema";
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
      playerIds: z.array(z.number()),
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
        // Import Discord client
        const { getDiscordClient } = await import("../discord-bot");
        const client = getDiscordClient();

        if (!client || !client.isReady()) {
          throw new Error("Discord bot is not connected");
        }

        // Calculate totals
        const team1TotalOvr = input.team1Players.reduce((sum, p) => sum + p.overall, 0);
        const team1TotalBadges = input.team1Players.reduce((sum, p) => sum + p.badges, 0);
        const team2TotalOvr = input.team2Players.reduce((sum, p) => sum + p.overall, 0);
        const team2TotalBadges = input.team2Players.reduce((sum, p) => sum + p.badges, 0);

        // Format trade message
        const lines: string[] = [];
        
        lines.push(`**${input.team1Name} Sends:**`);
        lines.push('');
        input.team1Players.forEach(player => {
          lines.push(`${player.name} ${player.overall} (${player.badges})`);
        });
        lines.push('--');
        lines.push(`${team1TotalOvr} (${team1TotalBadges})`);
        lines.push('');
        
        lines.push(`**${input.team2Name} Sends:**`);
        lines.push('');
        input.team2Players.forEach(player => {
          lines.push(`${player.name} ${player.overall} (${player.badges})`);
        });
        lines.push('--');
        lines.push(`${team2TotalOvr} (${team2TotalBadges})`);

        const message = lines.join('\n');

        // Post to Discord channel
        const channel = await client.channels.fetch(TRADE_CHANNEL_ID);
        
        if (!channel || !channel.isTextBased()) {
          throw new Error("Trade channel not found or not a text channel");
        }

        await channel.send(message);

        console.log(`[Trade Machine] Posted trade to Discord: ${input.team1Name} ↔ ${input.team2Name}`);

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
      try {
        // Import Discord client
        const { getDiscordClient } = await import("../discord-bot");
        const client = getDiscordClient();

        if (!client || !client.isReady()) {
          throw new Error("Discord bot is not connected");
        }

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

        // Send DMs to both users
        const errors: string[] = [];
        
        try {
          const team1User = await client.users.fetch(input.team1UserId);
          await team1User.send(team1Message);
          console.log(`[Trade Machine] Sent DM to ${input.team1Name} owner (${input.team1UserId})`);
        } catch (error) {
          console.error(`[Trade Machine] Failed to send DM to ${input.team1Name} owner:`, error);
          errors.push(`Failed to send DM to ${input.team1Name} owner`);
        }

        try {
          const team2User = await client.users.fetch(input.team2UserId);
          await team2User.send(team2Message);
          console.log(`[Trade Machine] Sent DM to ${input.team2Name} owner (${input.team2UserId})`);
        } catch (error) {
          console.error(`[Trade Machine] Failed to send DM to ${input.team2Name} owner:`, error);
          errors.push(`Failed to send DM to ${input.team2Name} owner`);
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
