import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { playerAliases } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const playerAliasesRouter = router({
  /**
   * Get all player aliases
   */
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const aliases = await db.select().from(playerAliases).orderBy(playerAliases.playerName);
    return aliases;
  }),

  /**
   * Add a new player alias
   */
  add: publicProcedure
    .input(
      z.object({
        playerId: z.string(),
        playerName: z.string(),
        alias: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if alias already exists
      const existing = await db
        .select()
        .from(playerAliases)
        .where(eq(playerAliases.alias, input.alias.toLowerCase()));

      if (existing.length > 0) {
        throw new Error(`Alias "${input.alias}" already exists for ${existing[0].playerName}`);
      }

      // Insert new alias
      await db.insert(playerAliases).values({
        playerId: input.playerId,
        playerName: input.playerName,
        alias: input.alias.toLowerCase(),
        matchCount: 0,
        addedBy: ctx.user?.id,
        addedByName: ctx.user?.name || undefined,
      });

      return { success: true };
    }),

  /**
   * Delete a player alias
   */
  delete: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(playerAliases).where(eq(playerAliases.id, input.id));

      return { success: true };
    }),

  /**
   * Increment match count for an alias
   */
  incrementMatchCount: publicProcedure
    .input(
      z.object({
        alias: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(playerAliases)
        .where(eq(playerAliases.alias, input.alias.toLowerCase()));

      if (existing.length > 0) {
        await db
          .update(playerAliases)
          .set({ matchCount: existing[0].matchCount + 1 })
          .where(eq(playerAliases.id, existing[0].id));
      }

      return { success: true };
    }),
});
