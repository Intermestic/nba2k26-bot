import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { playerSwaps, players } from "../../drizzle/schema";
import { eq, desc, like, or, and } from "drizzle-orm";

/**
 * Player Swaps Router - Manage player swaps for Season 17
 * Tracks DNA swaps, player replacements, and other roster changes
 */
export const playerSwapsRouter = router({
  /**
   * Get all player swaps with optional filters
   */
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        swapType: z.enum(["dna_swap", "player_replacement", "other"]).optional(),
        flagged: z.boolean().optional(),
        team: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(playerSwaps.oldPlayerName, `%${input.search}%`),
            like(playerSwaps.newPlayerName, `%${input.search}%`)
          )
        );
      }

      if (input.swapType) {
        conditions.push(eq(playerSwaps.swapType, input.swapType));
      }

      if (input.flagged !== undefined) {
        conditions.push(eq(playerSwaps.flagged, input.flagged ? 1 : 0));
      }

      if (input.team) {
        conditions.push(eq(playerSwaps.team, input.team));
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const swaps = await db
        .select()
        .from(playerSwaps)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(playerSwaps.createdAt));

      return swaps;
    }),

  /**
   * Get a single player swap by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [swap] = await db
        .select()
        .from(playerSwaps)
        .where(eq(playerSwaps.id, input.id));

      return swap;
    }),

  /**
   * Create a new player swap
   */
  create: protectedProcedure
    .input(
      z.object({
        playerId: z.string().optional(),
        oldPlayerName: z.string().min(1, "Old player name is required"),
        newPlayerName: z.string().min(1, "New player name is required"),
        team: z.string().optional(),
        swapType: z.enum(["dna_swap", "player_replacement", "other"]),
        swapDate: z.string().min(1, "Swap date is required"),
        oldPlayerOvr: z.number().optional(),
        newPlayerOvr: z.number().optional(),
        notes: z.string().optional(),
        flagged: z.boolean().default(false),
        flagReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(playerSwaps).values({
        playerId: input.playerId,
        oldPlayerName: input.oldPlayerName,
        newPlayerName: input.newPlayerName,
        team: input.team,
        swapType: input.swapType,
        swapDate: input.swapDate,
        oldPlayerOvr: input.oldPlayerOvr,
        newPlayerOvr: input.newPlayerOvr,
        notes: input.notes,
        flagged: input.flagged ? 1 : 0,
        flagReason: input.flagReason,
        addedBy: ctx.user.id,
        addedByName: ctx.user.name || "Unknown Admin",
      });

      return { id: Number(result.insertId) };
    }),

  /**
   * Update an existing player swap
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        playerId: z.string().optional(),
        oldPlayerName: z.string().optional(),
        newPlayerName: z.string().optional(),
        team: z.string().optional(),
        swapType: z.enum(["dna_swap", "player_replacement", "other"]).optional(),
        swapDate: z.string().optional(),
        oldPlayerOvr: z.number().optional(),
        newPlayerOvr: z.number().optional(),
        notes: z.string().optional(),
        flagged: z.boolean().optional(),
        flagReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;

      const updateData: any = {};
      if (updates.playerId !== undefined) updateData.playerId = updates.playerId;
      if (updates.oldPlayerName !== undefined) updateData.oldPlayerName = updates.oldPlayerName;
      if (updates.newPlayerName !== undefined) updateData.newPlayerName = updates.newPlayerName;
      if (updates.team !== undefined) updateData.team = updates.team;
      if (updates.swapType !== undefined) updateData.swapType = updates.swapType;
      if (updates.swapDate !== undefined) updateData.swapDate = updates.swapDate;
      if (updates.oldPlayerOvr !== undefined) updateData.oldPlayerOvr = updates.oldPlayerOvr;
      if (updates.newPlayerOvr !== undefined) updateData.newPlayerOvr = updates.newPlayerOvr;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.flagged !== undefined) updateData.flagged = updates.flagged ? 1 : 0;
      if (updates.flagReason !== undefined) updateData.flagReason = updates.flagReason;

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(playerSwaps).set(updateData).where(eq(playerSwaps.id, id));

      return { success: true };
    }),

  /**
   * Delete a player swap
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(playerSwaps).where(eq(playerSwaps.id, input.id));
      return { success: true };
    }),

  /**
   * Toggle flag status for a player swap
   */
  toggleFlag: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        flagged: z.boolean(),
        flagReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(playerSwaps)
        .set({
          flagged: input.flagged ? 1 : 0,
          flagReason: input.flagReason,
        })
        .where(eq(playerSwaps.id, input.id));

      return { success: true };
    }),

  /**
   * Get swap statistics
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allSwaps = await db.select().from(playerSwaps);

    const stats = {
      total: allSwaps.length,
      dnaSwaps: allSwaps.filter((s) => s.swapType === "dna_swap").length,
      playerReplacements: allSwaps.filter((s) => s.swapType === "player_replacement").length,
      other: allSwaps.filter((s) => s.swapType === "other").length,
      flagged: allSwaps.filter((s) => s.flagged === 1).length,
    };

    return stats;
  }),

  /**
   * Bulk import player swaps from CSV data
   */
  bulkImport: protectedProcedure
    .input(
      z.object({
        swaps: z.array(
          z.object({
            oldPlayerName: z.string(),
            newPlayerName: z.string(),
            team: z.string().optional(),
            swapType: z.enum(["dna_swap", "player_replacement", "other"]),
            swapDate: z.string(),
            oldPlayerOvr: z.number().optional(),
            newPlayerOvr: z.number().optional(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const values = input.swaps.map((swap) => ({
        oldPlayerName: swap.oldPlayerName,
        newPlayerName: swap.newPlayerName,
        team: swap.team,
        swapType: swap.swapType,
        swapDate: swap.swapDate,
        oldPlayerOvr: swap.oldPlayerOvr,
        newPlayerOvr: swap.newPlayerOvr,
        notes: swap.notes,
        flagged: 0,
        addedBy: ctx.user.id,
        addedByName: ctx.user.name || "Unknown Admin",
      }));

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (values.length > 0) {
        await db.insert(playerSwaps).values(values);
      }

      return { imported: values.length };
    }),
});
