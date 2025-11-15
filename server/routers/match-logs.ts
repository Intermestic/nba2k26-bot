import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { matchLogs } from '../../drizzle/schema';
import { desc, and, gte, lte, eq, sql } from 'drizzle-orm';
import { getDb } from '../db';

export const matchLogsRouter = router({
  /**
   * Get all match logs with optional filters
   */
  getAll: publicProcedure
    .input(z.object({
      minConfidence: z.number().optional(),
      maxConfidence: z.number().optional(),
      context: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const conditions = [];
      
      if (input.minConfidence !== undefined) {
        conditions.push(gte(matchLogs.confidenceScore, input.minConfidence));
      }
      
      if (input.maxConfidence !== undefined) {
        conditions.push(lte(matchLogs.confidenceScore, input.maxConfidence));
      }
      
      if (input.context) {
        conditions.push(eq(matchLogs.context, input.context));
      }
      
      const logs = await db
        .select()
        .from(matchLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(matchLogs.createdAt))
        .limit(input.limit);
      
      return logs;
    }),

  /**
   * Get match statistics
   */
  getStats: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db
        .select({
          totalMatches: sql<number>`COUNT(*)`,
          successfulMatches: sql<number>`SUM(CASE WHEN ${matchLogs.success} = 1 THEN 1 ELSE 0 END)`,
          avgConfidence: sql<number>`AVG(CASE WHEN ${matchLogs.confidenceScore} IS NOT NULL THEN ${matchLogs.confidenceScore} ELSE 0 END)`,
          lowConfidenceCount: sql<number>`SUM(CASE WHEN ${matchLogs.confidenceScore} < 70 AND ${matchLogs.success} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(matchLogs);
      
      const stats = result[0];
      const successRate = stats.totalMatches > 0 
        ? (Number(stats.successfulMatches) / Number(stats.totalMatches)) * 100 
        : 0;
      
      return {
        totalMatches: Number(stats.totalMatches),
        successRate,
        avgConfidence: Number(stats.avgConfidence),
        lowConfidenceCount: Number(stats.lowConfidenceCount),
      };
    }),
});
