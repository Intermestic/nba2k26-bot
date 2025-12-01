import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { upgradeLog } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq, desc, and, like, sql } from "drizzle-orm";

export const upgradeLogRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
      playerName: z.string().optional(),
      userName: z.string().optional(),
      sourceType: z.string().optional(),
      upgradeType: z.enum(["Badge", "Attribute"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      let query = db.select().from(upgradeLog);
      
      // Apply filters
      const conditions = [];
      if (input?.playerName) {
        conditions.push(like(upgradeLog.playerName, `%${input.playerName}%`));
      }
      if (input?.userName) {
        conditions.push(like(upgradeLog.userName, `%${input.userName}%`));
      }
      if (input?.sourceType) {
        conditions.push(eq(upgradeLog.sourceType, input.sourceType));
      }
      if (input?.upgradeType) {
        conditions.push(eq(upgradeLog.upgradeType, input.upgradeType));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      // Apply ordering and pagination
      query = query.orderBy(desc(upgradeLog.createdAt)) as any;
      if (input?.limit) {
        query = query.limit(input.limit) as any;
      }
      if (input?.offset) {
        query = query.offset(input.offset) as any;
      }
      
      const upgrades = await query;
      return upgrades;
    }),

  getStatistics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    // Get overall statistics
    const stats = await db
      .select({
        totalUpgrades: sql<number>`COUNT(*)`,
        uniquePlayers: sql<number>`COUNT(DISTINCT ${upgradeLog.playerName})`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${upgradeLog.userName})`,
        badgeUpgrades: sql<number>`SUM(CASE WHEN ${upgradeLog.upgradeType} = 'Badge' THEN 1 ELSE 0 END)`,
        attributeUpgrades: sql<number>`SUM(CASE WHEN ${upgradeLog.upgradeType} = 'Attribute' THEN 1 ELSE 0 END)`,
      })
      .from(upgradeLog);
    
    // Get breakdown by source type
    const bySource = await db
      .select({
        sourceType: upgradeLog.sourceType,
        count: sql<number>`COUNT(*)`,
      })
      .from(upgradeLog)
      .groupBy(upgradeLog.sourceType);
    
    // Get top players by upgrade count
    const topPlayers = await db
      .select({
        playerName: upgradeLog.playerName,
        upgradeCount: sql<number>`COUNT(*)`,
      })
      .from(upgradeLog)
      .groupBy(upgradeLog.playerName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);
    
    return {
      overall: stats[0],
      bySource,
      topPlayers,
    };
  }),

  getByPlayer: publicProcedure
    .input(z.object({
      playerName: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const upgrades = await db
        .select()
        .from(upgradeLog)
        .where(eq(upgradeLog.playerName, input.playerName))
        .orderBy(desc(upgradeLog.createdAt));
      return upgrades;
    }),

  getByUser: publicProcedure
    .input(z.object({
      userName: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const upgrades = await db
        .select()
        .from(upgradeLog)
        .where(eq(upgradeLog.userName, input.userName))
        .orderBy(desc(upgradeLog.createdAt));
      return upgrades;
    }),

  updateNotes: publicProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().nullable(),
      })
    )
    .mutation(async ({ input }: { input: { id: number; notes: string | null } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db
        .update(upgradeLog)
        .set({ notes: input.notes, updatedAt: new Date() })
        .where(eq(upgradeLog.id, input.id));

      return { success: true };
    }),

  toggleFlag: publicProcedure
    .input(
      z.object({
        id: z.number(),
        flagged: z.boolean(),
        flagReason: z.string().nullable(),
      })
    )
    .mutation(async ({ input }: { input: { id: number; flagged: boolean; flagReason: string | null } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db
        .update(upgradeLog)
        .set({
          flagged: input.flagged ? 1 : 0,
          flagReason: input.flagReason,
          updatedAt: new Date(),
        })
        .where(eq(upgradeLog.id, input.id));

      return { success: true };
    }),
});
