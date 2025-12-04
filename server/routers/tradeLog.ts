import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tradeLogs, players } from "../../drizzle/schema";

export const tradeLogRouter = router({
  /**
   * Get all trade logs with optional status filter
   */
  getTradeLogs: publicProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "declined", "all"]).optional().default("all"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = db.select().from(tradeLogs).orderBy(desc(tradeLogs.createdAt));

      if (input.status !== "all") {
        query = query.where(eq(tradeLogs.status, input.status)) as any;
      }

      const logs = await query;

      // Parse JSON fields
      return logs.map(log => ({
        ...log,
        team1Players: JSON.parse(log.team1Players),
        team2Players: JSON.parse(log.team2Players),
        playerBadges: JSON.parse(log.playerBadges),
      }));
    }),

  /**
   * Approve a trade and update player badge counts
   */
  approveTrade: publicProcedure
    .input(z.object({
      tradeId: z.number(),
      userId: z.number().optional(), // Admin user ID
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get trade log
      const [trade] = await db
        .select()
        .from(tradeLogs)
        .where(eq(tradeLogs.id, input.tradeId));

      if (!trade) {
        throw new Error("Trade not found");
      }

      if (trade.status !== "pending") {
        throw new Error(`Trade already ${trade.status}`);
      }

      const playerBadges = JSON.parse(trade.playerBadges) as Record<string, number>;

      // Update badge counts for all players in the trade
      for (const [playerName, badgeCount] of Object.entries(playerBadges)) {
        await db
          .update(players)
          .set({ badgeCount })
          .where(sql`LOWER(${players.name}) = LOWER(${playerName})`);
      }

      // Mark trade as approved
      await db
        .update(tradeLogs)
        .set({
          status: "approved",
          reviewedBy: input.userId,
          reviewedAt: new Date(),
        })
        .where(eq(tradeLogs.id, input.tradeId));

      console.log(`[Trade Log] Approved trade #${input.tradeId} and updated badge counts`);

      return {
        success: true,
        message: "Trade approved and badge counts updated",
      };
    }),

  /**
   * Decline a trade
   */
  declineTrade: publicProcedure
    .input(z.object({
      tradeId: z.number(),
      userId: z.number().optional(), // Admin user ID
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get trade log
      const [trade] = await db
        .select()
        .from(tradeLogs)
        .where(eq(tradeLogs.id, input.tradeId));

      if (!trade) {
        throw new Error("Trade not found");
      }

      if (trade.status !== "pending") {
        throw new Error(`Trade already ${trade.status}`);
      }

      // Mark trade as declined
      await db
        .update(tradeLogs)
        .set({
          status: "declined",
          reviewedBy: input.userId,
          reviewedAt: new Date(),
          notes: input.notes,
        })
        .where(eq(tradeLogs.id, input.tradeId));

      console.log(`[Trade Log] Declined trade #${input.tradeId}`);

      return {
        success: true,
        message: "Trade declined",
      };
    }),

  /**
   * Batch approve multiple trades
   */
  batchApproveTrades: publicProcedure
    .input(z.object({
      tradeIds: z.array(z.number()),
      userId: z.number().optional(), // Admin user ID
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const results = {
        approved: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const tradeId of input.tradeIds) {
        try {
          // Get trade log
          const [trade] = await db
            .select()
            .from(tradeLogs)
            .where(eq(tradeLogs.id, tradeId));

          if (!trade) {
            results.failed++;
            results.errors.push(`Trade #${tradeId} not found`);
            continue;
          }

          if (trade.status !== "pending") {
            results.failed++;
            results.errors.push(`Trade #${tradeId} already ${trade.status}`);
            continue;
          }

          const playerBadges = JSON.parse(trade.playerBadges) as Record<string, number>;

          // Update badge counts for all players in the trade
          for (const [playerName, badgeCount] of Object.entries(playerBadges)) {
            await db
              .update(players)
              .set({ badgeCount })
              .where(sql`LOWER(${players.name}) = LOWER(${playerName})`);
          }

          // Mark trade as approved
          await db
            .update(tradeLogs)
            .set({
              status: "approved",
              reviewedBy: input.userId,
              reviewedAt: new Date(),
            })
            .where(eq(tradeLogs.id, tradeId));

          results.approved++;
          console.log(`[Trade Log] Batch approved trade #${tradeId}`);
        } catch (error) {
          results.failed++;
          results.errors.push(`Trade #${tradeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        approved: results.approved,
        failed: results.failed,
        errors: results.errors,
      };
    }),
});
