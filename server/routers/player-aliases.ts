import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { playerAliases, failedSearches } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { normalizeName } from '../name-normalizer';

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
        .where(eq(playerAliases.alias, normalizeName(input.alias)));

      if (existing.length > 0) {
        throw new Error(`Alias "${input.alias}" already exists for ${existing[0].playerName}`);
      }

      // Insert new alias
      await db.insert(playerAliases).values({
        playerId: input.playerId,
        playerName: input.playerName,
        alias: normalizeName(input.alias),
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
        .where(eq(playerAliases.alias, normalizeName(input.alias)));

      if (existing.length > 0) {
        await db
          .update(playerAliases)
          .set({ matchCount: existing[0].matchCount + 1 })
          .where(eq(playerAliases.id, existing[0].id));
      }

      return { success: true };
    }),

  /**
   * Get all failed searches (unresolved)
   */
  getFailedSearches: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const failed = await db
      .select()
      .from(failedSearches)
      .where(eq(failedSearches.resolved, 0))
      .orderBy(desc(failedSearches.attemptCount), desc(failedSearches.lastAttempted));

    return failed;
  }),

  /**
   * Add failed search as alias and mark as resolved
   */
  addFailedSearchAsAlias: publicProcedure
    .input(
      z.object({
        failedSearchId: z.number(),
        playerId: z.string(),
        playerName: z.string(),
        searchTerm: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if alias already exists
      const existing = await db
        .select()
        .from(playerAliases)
        .where(eq(playerAliases.alias, normalizeName(input.searchTerm)));

      if (existing.length > 0) {
        throw new Error(`Alias "${input.searchTerm}" already exists for ${existing[0].playerName}`);
      }

      // Add as alias
      await db.insert(playerAliases).values({
        playerId: input.playerId,
        playerName: input.playerName,
        alias: normalizeName(input.searchTerm),
        matchCount: 0,
        addedBy: ctx.user?.id,
        addedByName: ctx.user?.name || undefined,
      });

      // Mark failed search as resolved
      await db
        .update(failedSearches)
        .set({
          resolved: 1,
          resolvedBy: ctx.user?.id,
          resolvedAt: new Date(),
        })
        .where(eq(failedSearches.id, input.failedSearchId));

      return { success: true };
    }),

  /**
   * Mark failed search as resolved without adding alias
   */
  markFailedSearchResolved: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(failedSearches)
        .set({
          resolved: 1,
          resolvedBy: ctx.user?.id,
          resolvedAt: new Date(),
        })
        .where(eq(failedSearches.id, input.id));

      return { success: true };
    }),
});
