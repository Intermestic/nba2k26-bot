import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { upgradeHistory } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";

export const upgradeHistoryRouter = router({
  /**
   * Get upgrade history for a specific player
   */
  getByPlayer: publicProcedure
    .input(z.object({
      playerId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      const history = await db
        .select()
        .from(upgradeHistory)
        .where(eq(upgradeHistory.playerId, input.playerId))
        .orderBy(desc(upgradeHistory.createdAt));
      
      return history;
    }),

  /**
   * Get upgrade history grouped by user for a specific player
   */
  getPlayerUpgradesByUser: publicProcedure
    .input(z.object({
      playerId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      const summary = await db
        .select({
          userId: upgradeHistory.userId,
          userName: upgradeHistory.userName,
          upgradeCount: sql<number>`COUNT(*)`,
          upgrades: sql<string>`GROUP_CONCAT(CONCAT(${upgradeHistory.attributeName}, ' (', DATE_FORMAT(${upgradeHistory.createdAt}, '%m/%d/%Y'), ')') ORDER BY ${upgradeHistory.createdAt} DESC SEPARATOR ', ')`,
        })
        .from(upgradeHistory)
        .where(eq(upgradeHistory.playerId, input.playerId))
        .groupBy(upgradeHistory.userId, upgradeHistory.userName)
        .orderBy(desc(sql`COUNT(*)`));
      
      return summary;
    }),

  /**
   * Record a new upgrade in history
   */
  recordUpgrade: publicProcedure
    .input(z.object({
      playerId: z.string(),
      playerName: z.string(),
      attributeName: z.string(),
      upgradeType: z.string(),
      userId: z.string(),
      userName: z.string(),
      team: z.string(),
      previousValue: z.string().optional(),
      newValue: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.insert(upgradeHistory).values({
        playerId: input.playerId,
        playerName: input.playerName,
        attributeName: input.attributeName,
        upgradeType: input.upgradeType,
        userId: input.userId,
        userName: input.userName,
        team: input.team,
        previousValue: input.previousValue,
        newValue: input.newValue,
      });
      
      return { success: true };
    }),

  /**
   * Get all upgrade history with optional filters
   */
  getAll: publicProcedure
    .input(z.object({
      playerId: z.string().optional(),
      userId: z.string().optional(),
      upgradeType: z.string().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      let query = db.select().from(upgradeHistory);
      
      // Apply filters
      const conditions = [];
      if (input?.playerId) {
        conditions.push(eq(upgradeHistory.playerId, input.playerId));
      }
      if (input?.userId) {
        conditions.push(eq(upgradeHistory.userId, input.userId));
      }
      if (input?.upgradeType) {
        conditions.push(eq(upgradeHistory.upgradeType, input.upgradeType));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      // Apply ordering and pagination
      query = query.orderBy(desc(upgradeHistory.createdAt)) as any;
      if (input?.limit) {
        query = query.limit(input.limit) as any;
      }
      
      const history = await query;
      return history;
    }),

  /**
   * Get upgrade statistics
   */
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const [stats] = await db
      .select({
        totalUpgrades: sql<number>`COUNT(*)`,
        uniquePlayers: sql<number>`COUNT(DISTINCT ${upgradeHistory.playerId})`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${upgradeHistory.userId})`,
      })
      .from(upgradeHistory);
    
    // Get breakdown by upgrade type
    const byType = await db
      .select({
        upgradeType: upgradeHistory.upgradeType,
        count: sql<number>`COUNT(*)`,
      })
      .from(upgradeHistory)
      .groupBy(upgradeHistory.upgradeType);
    
    return {
      ...stats,
      byType,
    };
  }),
});
