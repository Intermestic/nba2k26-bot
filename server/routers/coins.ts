import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { teamCoins, faTransactions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const coinsRouter = router({
  /**
   * Get all team coin balances
   */
  getAllTeamCoins: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get all team coins, ordered by team name
      const coins = await db.select().from(teamCoins).orderBy(teamCoins.team);

      return coins;
    }),

  /**
   * Get transaction history
   */
  getTransactionHistory: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get recent transactions, ordered by date descending
      const transactions = await db
        .select()
        .from(faTransactions)
        .orderBy(desc(faTransactions.processedAt))
        .limit(100);

      return transactions;
    }),

  /**
   * Manually adjust team coins
   */
  adjustCoins: protectedProcedure
    .input(z.object({
      team: z.string(),
      amount: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: { team: string; amount: number; reason?: string } }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get current coins
      const existing = await db.select().from(teamCoins).where(eq(teamCoins.team, input.team));

      if (existing.length === 0) {
        // Initialize if doesn't exist
        const initialCoins = (input.team === 'Nuggets' || input.team === 'Hawks') ? 115 : 100;
        const newCoins = initialCoins + input.amount;

        await db.insert(teamCoins).values({
          team: input.team,
          coinsRemaining: newCoins
        });

        return { success: true, newBalance: newCoins };
      }

      // Update coins
      const currentCoins = existing[0].coinsRemaining;
      const newCoins = currentCoins + input.amount;

      // Prevent negative coins
      if (newCoins < 0) {
        throw new Error("Cannot set coins below 0");
      }

      await db
        .update(teamCoins)
        .set({ coinsRemaining: newCoins })
        .where(eq(teamCoins.team, input.team));

      // Log the adjustment as a transaction
      await db.insert(faTransactions).values({
        team: input.team,
        dropPlayer: "N/A",
        signPlayer: "Manual Adjustment",
        signPlayerOvr: 0,
        bidAmount: input.amount,
        adminUser: ctx.user.name || ctx.user.openId,
        coinsRemaining: newCoins
      });

      return { success: true, newBalance: newCoins };
    })
});
