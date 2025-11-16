import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { upgradeRequests, playerUpgrades, badgeRequirements } from "../../drizzle/schema";
import { eq, and, desc, sql, like, inArray } from "drizzle-orm";
import { getDiscordClient } from "../discord-bot";

export const upgradesRouter = router({
  // Get all upgrade requests with filters
  getAllUpgrades: protectedProcedure
    .input(
      z.object({
        team: z.string().optional(),
        player: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select({
          id: upgradeRequests.id,
          playerName: upgradeRequests.playerName,
          team: upgradeRequests.team,
          badgeName: upgradeRequests.badgeName,
          fromLevel: upgradeRequests.fromLevel,
          toLevel: upgradeRequests.toLevel,
          attributes: upgradeRequests.attributes,
          status: upgradeRequests.status,
          requestedBy: upgradeRequests.requestedBy,
          createdAt: upgradeRequests.createdAt,
          approvedBy: upgradeRequests.approvedBy,
          approvedAt: upgradeRequests.approvedAt,
          validationErrors: upgradeRequests.validationErrors,
          ruleViolations: upgradeRequests.ruleViolations,
          gameNumber: upgradeRequests.gameNumber,
          requestedByName: upgradeRequests.requestedByName,
        })
        .from(upgradeRequests)
        .orderBy(desc(upgradeRequests.createdAt))
        .limit(input.limit);

      const results = await query;

      // Apply filters
      let filtered = results;
      if (input.team) {
        filtered = filtered.filter((r) => r.team === input.team);
      }
      if (input.player) {
        filtered = filtered.filter((r) =>
          r.playerName.toLowerCase().includes(input.player!.toLowerCase())
        );
      }
      if (input.status) {
        filtered = filtered.filter((r) => r.status === input.status);
      }

      return filtered;
    }),

  // Get upgrade statistics
  getUpgradeStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        byTeam: [],
        byBadge: [],
      };
    }

    const all = await db.select().from(upgradeRequests);

    const total = all.length;
    const pending = all.filter((r) => r.status === "pending").length;
    const approved = all.filter((r) => r.status === "approved").length;
    const rejected = all.filter((r) => r.status === "rejected").length;

    // Group by team
    const teamMap = new Map<string, number>();
    all.forEach((r) => {
      teamMap.set(r.team, (teamMap.get(r.team) || 0) + 1);
    });
    const byTeam = Array.from(teamMap.entries())
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count);

    // Group by badge
    const badgeMap = new Map<string, number>();
    all.forEach((r) => {
      badgeMap.set(r.badgeName, (badgeMap.get(r.badgeName) || 0) + 1);
    });
    const byBadge = Array.from(badgeMap.entries())
      .map(([badge, count]) => ({ badge, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 badges

    return {
      total,
      pending,
      approved,
      rejected,
      byTeam,
      byBadge,
    };
  }),

  // Get player upgrade history
  getPlayerUpgrades: protectedProcedure
    .input(
      z.object({
        playerName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const upgrades = await db
        .select()
        .from(playerUpgrades)
        .where(eq(playerUpgrades.playerName, input.playerName))
        .orderBy(desc(playerUpgrades.completedAt));

      return upgrades;
    }),

  // Export upgrades to CSV
  exportUpgrades: protectedProcedure
    .input(
      z.object({
        team: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select()
        .from(upgradeRequests)
        .orderBy(desc(upgradeRequests.createdAt));

      const results = await query;

      // Apply filters
      let filtered = results;
      if (input.team) {
        filtered = filtered.filter((r) => r.team === input.team);
      }
      if (input.status) {
        filtered = filtered.filter((r) => r.status === input.status);
      }

      return filtered;
    }),

  // Bulk approve upgrades
  bulkApprove: adminProcedure
    .input(
      z.object({
        requestIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const UPGRADE_LOG_CHANNEL_ID = process.env.UPGRADE_LOG_CHANNEL_ID || '1149106208498790500';

      // Fetch the requests to approve
      const allRequests = await db.select().from(upgradeRequests);
      const requests = allRequests.filter(r => input.requestIds.includes(r.id) && r.status === 'pending');

      if (requests.length === 0) {
        return { success: false, message: "No pending requests found", approved: 0 };
      }

      // Update all requests to approved
      await db
        .update(upgradeRequests)
        .set({
          status: 'approved',
          approvedBy: ctx.user.id.toString(),
          approvedAt: new Date(),
        })
        .where(inArray(upgradeRequests.id, input.requestIds));

      // Add to player_upgrades table
      for (const request of requests) {
        if (request.playerId) {
          await db.insert(playerUpgrades).values({
            playerId: request.playerId,
            playerName: request.playerName,
            badgeName: request.badgeName,
            fromLevel: request.fromLevel as "none" | "bronze" | "silver" | "gold",
            toLevel: request.toLevel as "bronze" | "silver" | "gold",
            upgradeType: request.fromLevel === "none" ? "new_badge" : "badge_level",
            gameNumber: request.gameNumber || null,
            requestId: request.id,
          });
        }
      }

      // Post to upgrade log channel
      try {
        const client = getDiscordClient();
        if (client && client.isReady()) {
          const logChannel = await client.channels.fetch(UPGRADE_LOG_CHANNEL_ID);
          if (logChannel && 'send' in logChannel) {
            for (const request of requests) {
              const logEmbed = {
                color: 0x00ff00,
                title: '✅ Badge Upgrade Approved',
                fields: [
                  { name: 'Player', value: request.playerName, inline: true },
                  { name: 'Team', value: request.team, inline: true },
                  { name: 'Badge', value: `${request.badgeName} (${request.fromLevel} → ${request.toLevel})`, inline: false },
                  { name: 'Approved By', value: ctx.user.name || 'Admin', inline: true },
                  { name: 'Requested By', value: request.requestedByName || 'Unknown', inline: true },
                ],
                timestamp: new Date().toISOString(),
              };

              if (request.attributes) {
                try {
                  const attrs = JSON.parse(request.attributes);
                  const attrText = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
                  logEmbed.fields.push({ name: 'Attributes', value: attrText, inline: false });
                } catch (e) {
                  // Skip if attributes can't be parsed
                }
              }

              await logChannel.send({ embeds: [logEmbed] });
            }
          }
        }
      } catch (error) {
        console.error('[Bulk Approve] Error posting to Discord:', error);
      }

      return {
        success: true,
        message: `Approved ${requests.length} upgrade(s)`,
        approved: requests.length,
      };
    }),

  // Bulk reject upgrades
  bulkReject: adminProcedure
    .input(
      z.object({
        requestIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch the requests to reject
      const allRequests = await db.select().from(upgradeRequests);
      const requests = allRequests.filter(r => input.requestIds.includes(r.id) && r.status === 'pending');

      if (requests.length === 0) {
        return { success: false, message: "No pending requests found", rejected: 0 };
      }

      // Update all requests to rejected
      await db
        .update(upgradeRequests)
        .set({
          status: 'rejected',
          approvedBy: ctx.user.id.toString(),
          approvedAt: new Date(),
        })
        .where(inArray(upgradeRequests.id, input.requestIds));

      return {
        success: true,
        message: `Rejected ${requests.length} upgrade(s)`,
        rejected: requests.length,
      };
    }),
});
