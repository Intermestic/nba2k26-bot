import { router, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { 
  upgradeRequests, 
  faBids, 
  capViolations, 
  players, 
  faTransactions,
  teamAssignments 
} from '../../drizzle/schema';
import { eq, count, and, sql } from 'drizzle-orm';

export const dashboardRouter = router({
  /**
   * Get dashboard statistics for admin cards
   */
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Count pending upgrade requests
    const pendingUpgrades = await db
      .select({ count: count() })
      .from(upgradeRequests)
      .where(eq(upgradeRequests.status, 'pending'));

    // Count active FA bids (all bids in faBids table are considered active)
    const activeBids = await db
      .select({ count: count() })
      .from(faBids);

    // Count cap violations
    const violations = await db
      .select({ count: count() })
      .from(capViolations)
      .where(eq(capViolations.resolved, 0));

    // Count total players
    const totalPlayers = await db
      .select({ count: count() })
      .from(players);

    // Count total teams (players with non-null team, excluding "Free Agents")
    const totalTeams = await db
      .selectDistinct({ team: players.team })
      .from(players)
      .where(
        and(
          sql`${players.team} IS NOT NULL`,
          sql`${players.team} != 'Free Agents'`
        )
      );

    // Count total transactions
    const totalTransactions = await db
      .select({ count: count() })
      .from(faTransactions);

    // Count team assignments
    const totalAssignments = await db
      .select({ count: count() })
      .from(teamAssignments);

    return {
      pendingUpgrades: pendingUpgrades[0]?.count || 0,
      activeBids: activeBids[0]?.count || 0,
      capViolations: violations[0]?.count || 0,
      totalPlayers: totalPlayers[0]?.count || 0,
      totalTeams: totalTeams.length || 0,
      totalTransactions: totalTransactions[0]?.count || 0,
      totalAssignments: totalAssignments[0]?.count || 0,
    };
  }),
});
