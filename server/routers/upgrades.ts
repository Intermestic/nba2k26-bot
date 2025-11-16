import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { upgradeRequests, playerUpgrades } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
});
