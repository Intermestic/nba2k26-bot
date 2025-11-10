import { z } from "zod";
import { eq, like, and, gte } from "drizzle-orm";
import { players } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const playerRouter = router({
  // Public: List all players with optional filters
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        minRating: z.number().min(0).max(99).optional(),
        limit: z.number().min(1).max(1000).default(1000),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input?.search) {
        conditions.push(like(players.name, `%${input.search}%`));
      }
      if (input?.minRating !== undefined) {
        conditions.push(gte(players.overall, input.minRating));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select()
        .from(players)
        .where(whereClause)
        .limit(input?.limit || 1000)
        .offset(input?.offset || 0);

      return result;
    }),

  // Public: Get single player by ID
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(players)
        .where(eq(players.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Protected: Update player (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        overall: z.number().min(0).max(99).optional(),
        photoUrl: z.string().nullable().optional(),
        playerPageUrl: z.string().nullable().optional(),
        badgeCount: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(players)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(players.id, id));

      return { success: true };
    }),

  // Protected: Create new player (admin only)
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        overall: z.number().min(0).max(99),
        photoUrl: z.string().nullable().optional(),
        playerPageUrl: z.string().nullable().optional(),
        nbaId: z.string().nullable().optional(),
        source: z.string().optional(),
        badgeCount: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(players).values(input);

      return { success: true };
    }),

  // Protected: Delete player (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(players).where(eq(players.id, input.id));

      return { success: true };
    }),
});
