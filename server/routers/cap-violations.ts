import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { capViolations } from "../../drizzle/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { z } from "zod";

export const capViolationsRouter = router({
  /**
   * Get all cap violations with optional filters
   */
  getAll: publicProcedure
    .input(z.object({
      team: z.string().optional(),
      resolved: z.boolean().optional(),
      limit: z.number().min(1).max(1000).default(100),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const filters = [];
      if (input?.team) {
        filters.push(eq(capViolations.team, input.team));
      }
      if (input?.resolved !== undefined) {
        filters.push(eq(capViolations.resolved, input.resolved ? 1 : 0));
      }
      
      const violations = await db
        .select()
        .from(capViolations)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(capViolations.createdAt))
        .limit(input?.limit || 100);
      
      return violations;
    }),
  
  /**
   * Get violation statistics
   */
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Total violations
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(capViolations);
    const total = Number(totalResult[0]?.count || 0);
    
    // Active (unresolved) violations
    const activeResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(capViolations)
      .where(eq(capViolations.resolved, 0));
    const active = Number(activeResult[0]?.count || 0);
    
    // Resolved violations
    const resolvedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(capViolations)
      .where(eq(capViolations.resolved, 1));
    const resolved = Number(resolvedResult[0]?.count || 0);
    
    // Repeat offenders (teams with multiple violations)
    const repeatOffendersResult = await db
      .select({
        team: capViolations.team,
        count: sql<number>`count(*)`
      })
      .from(capViolations)
      .groupBy(capViolations.team)
      .having(sql`count(*) > 1`)
      .orderBy(desc(sql`count(*)`));
    
    const repeatOffenders = repeatOffendersResult.map(r => ({
      team: r.team,
      count: Number(r.count)
    }));
    
    // Average time to resolution (for resolved violations)
    const avgResolutionResult = await db
      .select({
        avgHours: sql<number>`AVG(TIMESTAMPDIFF(HOUR, ${capViolations.createdAt}, ${capViolations.resolvedAt}))`
      })
      .from(capViolations)
      .where(eq(capViolations.resolved, 1));
    
    const avgResolutionHours = Number(avgResolutionResult[0]?.avgHours || 0);
    
    return {
      total,
      active,
      resolved,
      repeatOffenders,
      avgResolutionHours: Math.round(avgResolutionHours * 10) / 10 // Round to 1 decimal
    };
  }),
  
  /**
   * Get current active violations
   */
  getActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const violations = await db
      .select()
      .from(capViolations)
      .where(eq(capViolations.resolved, 0))
      .orderBy(desc(capViolations.createdAt));
    
    return violations;
  }),
});
