import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { teamAliases } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { VALID_TEAMS } from '../team-validator';

export const teamAliasesRouter = router({
  /**
   * Get all team aliases
   */
  getAll: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const aliases = await db
        .select()
        .from(teamAliases)
        .orderBy(desc(teamAliases.createdAt));

      return aliases;
    }),

  /**
   * Get list of valid canonical team names
   */
  getValidTeams: protectedProcedure
    .query(async () => {
      return VALID_TEAMS.filter(team => team !== 'Free Agents');
    }),

  /**
   * Create a new team alias
   */
  create: protectedProcedure
    .input(z.object({
      alias: z.string().min(1).max(100),
      canonicalName: z.string().min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Validate canonical name is a valid team
      if (!VALID_TEAMS.includes(input.canonicalName as any)) {
        throw new Error(`Invalid canonical team name: ${input.canonicalName}`);
      }

      // Check if alias already exists
      const existing = await db
        .select()
        .from(teamAliases)
        .where(eq(teamAliases.alias, input.alias));

      if (existing.length > 0) {
        throw new Error(`Alias "${input.alias}" already exists`);
      }

      await db.insert(teamAliases).values({
        alias: input.alias,
        canonicalName: input.canonicalName,
        createdBy: ctx.user?.id,
      });

      return { success: true };
    }),

  /**
   * Update an existing team alias
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      alias: z.string().min(1).max(100),
      canonicalName: z.string().min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Validate canonical name is a valid team
      if (!VALID_TEAMS.includes(input.canonicalName as any)) {
        throw new Error(`Invalid canonical team name: ${input.canonicalName}`);
      }

      // Check if new alias conflicts with another entry
      const existing = await db
        .select()
        .from(teamAliases)
        .where(eq(teamAliases.alias, input.alias));

      if (existing.length > 0 && existing[0].id !== input.id) {
        throw new Error(`Alias "${input.alias}" is already used by another entry`);
      }

      await db
        .update(teamAliases)
        .set({
          alias: input.alias,
          canonicalName: input.canonicalName,
        })
        .where(eq(teamAliases.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a team alias
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .delete(teamAliases)
        .where(eq(teamAliases.id, input.id));

      return { success: true };
    }),
});
