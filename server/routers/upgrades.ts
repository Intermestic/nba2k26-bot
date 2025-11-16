import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { upgradeRequests, playerUpgrades } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDiscordClient } from "../discord-bot";
import { TextChannel, EmbedBuilder } from "discord.js";
import { getConfig } from "../bot-config-loader";

export const upgradesRouter = router({
  /**
   * Get all upgrade requests
   */
  getAllUpgrades: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allRequests = await db.select().from(upgradeRequests);
    return allRequests;
  }),

  /**
   * Bulk approve upgrade requests
   */
  bulkApprove: publicProcedure
    .input(z.object({
      requestIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let successCount = 0;
      let failCount = 0;

      for (const requestId of input.requestIds) {
        try {
          // Get the request
          const requests = await db
            .select()
            .from(upgradeRequests)
            .where(eq(upgradeRequests.id, requestId));

          if (requests.length === 0) {
            failCount++;
            continue;
          }

          const request = requests[0];

          // Update status to approved
          await db
            .update(upgradeRequests)
            .set({
              status: "approved",
              approvedAt: new Date(),
            })
            .where(eq(upgradeRequests.id, requestId));

          // Add to player_upgrades if player exists
          if (request.playerId) {
            await db.insert(playerUpgrades).values({
              playerId: request.playerId,
              playerName: request.playerName,
              badgeName: request.badgeName,
              fromLevel: request.fromLevel,
              toLevel: request.toLevel,
              upgradeType: request.fromLevel === "none" ? "new_badge" : "badge_level",
              gameNumber: request.gameNumber,
              requestId: request.id,
            });
          }

          // Add ✅ reaction to original Discord message
          try {
            const client = getDiscordClient();
            if (client && client.isReady()) {
              const channel = await client.channels.fetch(request.channelId) as TextChannel;
              if (channel) {
                const message = await channel.messages.fetch(request.messageId);
                if (message) {
                  await message.react("✅");
                }
              }
            }
          } catch (error) {
            console.error("[Upgrades] Failed to add ✅ reaction:", error);
          }

          // Post to Discord upgrade log channel
          try {
            const client = getDiscordClient();
            const upgradeLogChannelId = await getConfig("upgrade_log_channel_id");
            if (client && client.isReady() && upgradeLogChannelId) {
              const logChannel = await client.channels.fetch(upgradeLogChannelId) as TextChannel;
              if (logChannel) {
                let attributesDisplay = "";
                if (request.attributes) {
                  try {
                    const attrs = JSON.parse(request.attributes as string);
                    attributesDisplay = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(", ");
                  } catch (e) {
                    // Ignore parse errors
                  }
                }

                await logChannel.send({
                  embeds: [{
                    title: "✅ Upgrade Approved",
                    color: 0x00ff00,
                    fields: [
                      { name: "Player", value: request.playerName, inline: true },
                      { name: "Team", value: request.team, inline: true },
                      { name: "Badge", value: `${request.badgeName} → ${request.toLevel}`, inline: true },
                      ...(attributesDisplay ? [{ name: "Attributes", value: attributesDisplay, inline: false }] : []),
                      ...(request.gameNumber ? [{ name: "Game", value: `${request.gameNumber}GM`, inline: true }] : []),
                    ],
                    timestamp: new Date().toISOString(),
                  }],
                });
              }
            }
          } catch (error) {
            console.error("[Upgrades] Failed to post to log channel:", error);
          }

          successCount++;
        } catch (error) {
          console.error(`[Upgrades] Failed to approve request ${requestId}:`, error);
          failCount++;
        }
      }

      return {
        successCount,
        failCount,
      };
    }),

  /**
   * Bulk reject upgrade requests
   */
  bulkReject: publicProcedure
    .input(z.object({
      requestIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let successCount = 0;
      let failCount = 0;

      for (const requestId of input.requestIds) {
        try {
          await db
            .update(upgradeRequests)
            .set({
              status: "rejected",
              approvedAt: new Date(),
            })
            .where(eq(upgradeRequests.id, requestId));

          successCount++;
        } catch (error) {
          console.error(`[Upgrades] Failed to reject request ${requestId}:`, error);
          failCount++;
        }
      }

      return {
        successCount,
        failCount,
      };
    }),

  /**
   * Get upgrade history for a player
   */
  getPlayerUpgrades: publicProcedure
    .input(z.object({
      playerId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const upgrades = await db
        .select()
        .from(playerUpgrades)
        .where(eq(playerUpgrades.playerId, input.playerId));

      return upgrades;
    }),

  /**
   * Bulk revert approved or rejected upgrades back to pending
   */
  bulkRevert: publicProcedure
    .input(z.object({
      requestIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let successCount = 0;
      let failCount = 0;

      for (const requestId of input.requestIds) {
        try {
          // Get the request
          const requests = await db
            .select()
            .from(upgradeRequests)
            .where(eq(upgradeRequests.id, requestId));

          if (requests.length === 0) {
            failCount++;
            continue;
          }

          const request = requests[0];

          // Only allow reverting approved or rejected upgrades
          if (request.status !== "approved" && request.status !== "rejected") {
            failCount++;
            continue;
          }

          // Update status back to pending
          await db
            .update(upgradeRequests)
            .set({
              status: "pending",
              approvedAt: null,
              approvedBy: null,
            })
            .where(eq(upgradeRequests.id, requestId));

          // Remove from player_upgrades if it was approved
          if (request.status === "approved") {
            await db
              .delete(playerUpgrades)
              .where(eq(playerUpgrades.requestId, requestId));
          }

          // Remove Discord reactions
          try {
            const client = getDiscordClient();
            if (client && client.isReady()) {
              const channel = await client.channels.fetch(request.channelId) as TextChannel;
              if (channel) {
                const message = await channel.messages.fetch(request.messageId);
                if (message) {
                  // Remove both ✅ and ❌ reactions
                  await message.reactions.cache.get('✅')?.users.remove(client.user!.id);
                  await message.reactions.cache.get('❌')?.users.remove(client.user!.id);
                }
              }
            }
          } catch (error) {
            console.error('[Bulk Revert] Failed to remove Discord reaction:', error);
          }

          successCount++;
        } catch (error) {
          console.error('[Bulk Revert] Failed to revert upgrade:', error);
          failCount++;
        }
      }

      return {
        successCount,
        failCount,
        message: `Reverted ${successCount} upgrades${failCount > 0 ? `, ${failCount} failed` : ''}`
      };
    }),

  /**
   * Revert an approved or rejected upgrade back to pending
   */
  revertUpgrade: publicProcedure
    .input(z.object({
      requestId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Get the request
        const requests = await db
          .select()
          .from(upgradeRequests)
          .where(eq(upgradeRequests.id, input.requestId));

        if (requests.length === 0) {
          throw new Error("Upgrade request not found");
        }

        const request = requests[0];

        // Only allow reverting approved or rejected upgrades
        if (request.status !== "approved" && request.status !== "rejected") {
          throw new Error("Can only revert approved or rejected upgrades");
        }

        // Update status back to pending
        await db
          .update(upgradeRequests)
          .set({
            status: "pending",
            approvedAt: null,
            approvedBy: null,
          })
          .where(eq(upgradeRequests.id, input.requestId));

        // Remove from player_upgrades if it was approved
        if (request.status === "approved") {
          await db
            .delete(playerUpgrades)
            .where(eq(playerUpgrades.requestId, input.requestId));
        }

        // Remove ✅ reaction from Discord message if present
        try {
          const client = getDiscordClient();
          if (client && client.isReady()) {
            const channel = await client.channels.fetch(request.channelId) as TextChannel;
            if (channel) {
              const message = await channel.messages.fetch(request.messageId);
              if (message) {
                const botReactions = message.reactions.cache.filter(r => r.me);
                const reactionsArray = Array.from(botReactions.values());
                for (const reaction of reactionsArray) {
                  await reaction.users.remove(client.user!.id);
                }
              }
            }
          }
        } catch (error) {
          console.error("[Upgrades] Failed to remove reactions:", error);
        }

        return { success: true };
      } catch (error) {
        console.error(`[Upgrades] Failed to revert request ${input.requestId}:`, error);
        throw error;
      }
    }),
});
