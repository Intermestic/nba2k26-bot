import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { upgradeRequests, playerUpgrades, badgeRequirements } from "../../drizzle/schema";
import { eq, and, desc, sql, like } from "drizzle-orm";

export const upgradesRouter = router({
  // Get all upgrade requests with filters
  getAllUpgrades: protectedProcedure
    .input(
      z.object({
        team: z.string().optional(),
        player: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select({
          id: upgradeRequests.id,
          playerName: upgradeRequests.playerName,
          team: upgradeRequests.team,
          badgeName: upgradeRequests.badgeName,
          fromLevel: upgradeRequests.fromLevel,
          toLevel: upgradeRequests.toLevel,
          attributes: upgradeRequests.attributes,
          status: upgradeRequests.status,
          requestedBy: upgradeRequests.requestedBy,
          createdAt: upgradeRequests.createdAt,
          approvedBy: upgradeRequests.approvedBy,
          approvedAt: upgradeRequests.approvedAt,
          validationErrors: upgradeRequests.validationErrors,
          ruleViolations: upgradeRequests.ruleViolations,
        })
        .from(upgradeRequests)
        .orderBy(desc(upgradeRequests.createdAt))
        .limit(input.limit);

      const results = await query;

      // Apply filters
      let filtered = results;
      if (input.team) {
        filtered = filtered.filter((r) => r.team === input.team);
      }
      if (input.player) {
        filtered = filtered.filter((r) =>
          r.playerName.toLowerCase().includes(input.player!.toLowerCase())
        );
      }
      if (input.status) {
        filtered = filtered.filter((r) => r.status === input.status);
      }

      return filtered;
    }),

  // Get upgrade statistics
  getUpgradeStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        byTeam: [],
        byBadge: [],
      };
    }

    const all = await db.select().from(upgradeRequests);

    const total = all.length;
    const pending = all.filter((r) => r.status === "pending").length;
    const approved = all.filter((r) => r.status === "approved").length;
    const rejected = all.filter((r) => r.status === "rejected").length;

    // Group by team
    const teamMap = new Map<string, number>();
    all.forEach((r) => {
      teamMap.set(r.team, (teamMap.get(r.team) || 0) + 1);
    });
    const byTeam = Array.from(teamMap.entries())
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count);

    // Group by badge
    const badgeMap = new Map<string, number>();
    all.forEach((r) => {
      badgeMap.set(r.badgeName, (badgeMap.get(r.badgeName) || 0) + 1);
    });
    const byBadge = Array.from(badgeMap.entries())
      .map(([badge, count]) => ({ badge, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 badges

    return {
      total,
      pending,
      approved,
      rejected,
      byTeam,
      byBadge,
    };
  }),

  // Get player upgrade history
  getPlayerUpgrades: protectedProcedure
    .input(
      z.object({
        playerName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const upgrades = await db
        .select()
        .from(playerUpgrades)
        .where(eq(playerUpgrades.playerName, input.playerName))
        .orderBy(desc(playerUpgrades.completedAt));

      return upgrades;
    }),

  // Export upgrades to CSV
  exportUpgrades: protectedProcedure
    .input(
      z.object({
        team: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select()
        .from(upgradeRequests)
        .orderBy(desc(upgradeRequests.createdAt));

      const results = await query;

      // Apply filters
      let filtered = results;
      if (input.team) {
        filtered = filtered.filter((r) => r.team === input.team);
      }
      if (input.status) {
        filtered = filtered.filter((r) => r.status === input.status);
      }

      return filtered;
    }),
});
