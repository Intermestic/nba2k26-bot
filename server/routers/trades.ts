import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { trades } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const tradesRouter = router({
  /**
   * Get all trades with optional status filter
   */
  getAllTrades: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "reversed"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        let query = db.select().from(trades);
        
        if (input?.status) {
          query = query.where(eq(trades.status, input.status)) as any;
        }
        
        const result = await query.orderBy(desc(trades.createdAt));
        
        // Parse JSON strings for players
        return result.map((trade: any) => ({
          ...trade,
          team1Players: JSON.parse(trade.team1Players),
          team2Players: JSON.parse(trade.team2Players),
        }));
      } catch (error) {
        console.error("[Trades] Failed to get trades:", error);
        throw new Error("Failed to fetch trades");
      }
    }),

  /**
   * Get a single trade by ID
   */
  getTrade: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db
          .select()
          .from(trades)
          .where(eq(trades.id, input.id))
          .limit(1);
        
        if (result.length === 0) {
          throw new Error("Trade not found");
        }
        
        const trade = result[0];
        return {
          ...trade,
          team1Players: JSON.parse(trade.team1Players),
          team2Players: JSON.parse(trade.team2Players),
        };
      } catch (error) {
        console.error("[Trades] Failed to get trade:", error);
        throw new Error("Failed to fetch trade");
      }
    }),

  /**
   * Approve a trade
   */
  approveTrade: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      adminName: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .update(trades)
          .set({
            status: "approved",
            approvedBy: input.adminName,
            processedAt: new Date(),
          })
          .where(eq(trades.id, input.id));
        
        return { success: true };
      } catch (error) {
        console.error("[Trades] Failed to approve trade:", error);
        throw new Error("Failed to approve trade");
      }
    }),

  /**
   * Reject a trade
   */
  rejectTrade: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      adminName: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .update(trades)
          .set({
            status: "rejected",
            rejectedBy: input.adminName,
            processedAt: new Date(),
          })
          .where(eq(trades.id, input.id));
        
        return { success: true };
      } catch (error) {
        console.error("[Trades] Failed to reject trade:", error);
        throw new Error("Failed to reject trade");
      }
    }),

  /**
   * Reverse a trade (undo approval/rejection)
   */
  reverseTrade: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      adminName: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .update(trades)
          .set({
            status: "reversed",
            reversedBy: input.adminName,
            reversedAt: new Date(),
          })
          .where(eq(trades.id, input.id));
        
        return { success: true };
      } catch (error) {
        console.error("[Trades] Failed to reverse trade:", error);
        throw new Error("Failed to reverse trade");
      }
    }),

  /**
   * Close all pending trades (mark as rejected)
   */
  closeAllPendingTrades: protectedProcedure
    .input(z.object({ 
      adminName: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db
          .update(trades)
          .set({
            status: "rejected",
            rejectedBy: `${input.adminName} (Bulk Close)`,
            processedAt: new Date(),
          })
          .where(eq(trades.status, "pending"));
        
        return { success: true };
      } catch (error) {
        console.error("[Trades] Failed to close all pending trades:", error);
        throw new Error("Failed to close all pending trades");
      }
    }),
});
