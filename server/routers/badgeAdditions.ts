import { router, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { badgeAdditions, players } from '../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

export const badgeAdditionsRouter = router({
  // Get all badge additions with player and team info
  getAll: publicProcedure
    .input(z.object({
      playerId: z.number().optional(),
      badgeName: z.string().optional(),
      silverOnly: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      let query = db
        .select({
          id: badgeAdditions.id,
          playerId: badgeAdditions.playerId,
          badgeName: badgeAdditions.badgeName,
          addedAt: badgeAdditions.addedAt,
          usedForSilver: badgeAdditions.usedForSilver,
          playerName: players.name,
          teamName: players.team,
          isRookie: players.isRookie,
        })
        .from(badgeAdditions)
        .innerJoin(players, eq(badgeAdditions.playerId, players.id))
        .orderBy(desc(badgeAdditions.addedAt));

      // Apply filters if provided
      if (input?.playerId) {
        query = query.where(eq(badgeAdditions.playerId, input.playerId));
      }
      if (input?.badgeName) {
        query = query.where(eq(badgeAdditions.badgeName, input.badgeName));
      }
      if (input?.silverOnly) {
        query = query.where(eq(badgeAdditions.usedForSilver, 1));
      }

      const results = await query;
      return results;
    }),

  // Get statistics
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    const [totalAdditions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(badgeAdditions);

    const [silverUpgrades] = await db
      .select({ count: sql<number>`count(*)` })
      .from(badgeAdditions)
      .where(eq(badgeAdditions.usedForSilver, 1));

    const [rookiesWithAdditions] = await db
      .select({ count: sql<number>`count(distinct ${badgeAdditions.playerId})` })
      .from(badgeAdditions)
      .innerJoin(players, eq(badgeAdditions.playerId, players.id))
      .where(eq(players.isRookie, 1));

    return {
      totalAdditions: totalAdditions?.count || 0,
      silverUpgrades: silverUpgrades?.count || 0,
      rookiesWithAdditions: rookiesWithAdditions?.count || 0,
    };
  }),

  // Get badge additions grouped by player
  getByPlayer: publicProcedure.query(async () => {
    const db = await getDb();
    const results = await db
      .select({
        playerId: badgeAdditions.playerId,
        playerName: players.name,
        teamName: players.team,
        isRookie: players.isRookie,
        totalAdditions: sql<number>`count(*)`,
        silverUpgrades: sql<number>`sum(case when ${badgeAdditions.usedForSilver} = 1 then 1 else 0 end)`,
      })
      .from(badgeAdditions)
      .innerJoin(players, eq(badgeAdditions.playerId, players.id))
      .groupBy(badgeAdditions.playerId, players.name, players.team, players.isRookie)
      .orderBy(desc(sql`count(*)`));

    return results;
  }),
});
