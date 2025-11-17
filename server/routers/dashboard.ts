import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { players, faBids, capViolations, faTransactions, teamAssignments } from "../../drizzle/schema";
import { eq, and, ne, sql } from "drizzle-orm";

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get active bids count (current window)
    const now = new Date();
    const hour = now.getHours();
    const isPM = hour >= 12;
    const dateStr = now.toISOString().split("T")[0];
    const windowId = `${dateStr}-${isPM ? "PM" : "AM"}`;

    const activeBidsResult = await db
      .select({ count: sql<number>`count(distinct ${faBids.playerName})` })
      .from(faBids)
      .where(eq(faBids.windowId, windowId));
    const activeBids = Number(activeBidsResult[0]?.count || 0);

    // Get unresolved cap violations count
    const capViolationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(capViolations)
      .where(eq(capViolations.resolved, 0));
    const capViolationsCount = Number(capViolationsResult[0]?.count || 0);

    // Get total players count
    const totalPlayersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(players);
    const totalPlayers = Number(totalPlayersResult[0]?.count || 0);

    // Get total teams count (excluding Free Agents)
    const totalTeamsResult = await db
      .select({ count: sql<number>`count(distinct ${players.team})` })
      .from(players)
      .where(
        and(
          ne(players.team, "Free Agents"),
          ne(players.team, "Free Agent")
        )
      );
    const totalTeams = Number(totalTeamsResult[0]?.count || 0);

    // Get total FA transactions count
    const totalTransactionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(faTransactions);
    const totalTransactions = Number(totalTransactionsResult[0]?.count || 0);

    // Get total team assignments count
    const totalAssignmentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(teamAssignments);
    const totalAssignments = Number(totalAssignmentsResult[0]?.count || 0);

    return {
      activeBids,
      capViolations: capViolationsCount,
      totalPlayers,
      totalTeams,
      totalTransactions,
      totalAssignments,
    };
  }),
});
