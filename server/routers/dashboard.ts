import { router, publicProcedure } from '../_core/trpc';

const OVERALL_CAP_LIMIT = 1098;
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

  /**
   * Get all teams with their cap data (total overall, player count, cap status)
   */
  getTeamsWithCapData: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Get all players with non-null teams (including Free Agents)
    const allPlayers = await db
      .select({
        team: players.team,
        overall: players.overall,
      })
      .from(players)
      .where(sql`${players.team} IS NOT NULL`);

    // Group by team and calculate totals
    const teamMap = new Map<string, { totalOverall: number; playerCount: number }>();
    
    allPlayers.forEach((player) => {
      const team = player.team!;
      const existing = teamMap.get(team) || { totalOverall: 0, playerCount: 0 };
      teamMap.set(team, {
        totalOverall: existing.totalOverall + player.overall,
        playerCount: existing.playerCount + 1,
      });
    });

    // Convert to array and add cap status
    const teams = Array.from(teamMap.entries()).map(([team, data]) => {
      // Free Agents don't have cap limits
      const isFreeAgents = team === 'Free Agents';
      const overCap = isFreeAgents ? 0 : data.totalOverall - OVERALL_CAP_LIMIT;
      return {
        team,
        totalOverall: data.totalOverall,
        playerCount: data.playerCount,
        overCap,
        isOverCap: !isFreeAgents && overCap > 0,
        isFreeAgents,
      };
    });

    // Sort: Free Agents at bottom, then under cap teams (by total overall desc), then over cap teams (by over amount desc)
    teams.sort((a, b) => {
      // Free Agents always at bottom
      if (a.isFreeAgents && !b.isFreeAgents) return 1;
      if (!a.isFreeAgents && b.isFreeAgents) return -1;
      
      // Regular team sorting
      if (a.isOverCap && !b.isOverCap) return 1;
      if (!a.isOverCap && b.isOverCap) return -1;
      if (a.isOverCap && b.isOverCap) return b.overCap - a.overCap;
      return b.totalOverall - a.totalOverall;
    });

    return teams;
  }),
});
