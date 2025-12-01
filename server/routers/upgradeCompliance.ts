import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { upgradeAuditor } from "../services/upgradeAudit";
import { getDb } from "../db";
import { upgradeViolations, upgradeAudits, upgradeRules } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const upgradeComplianceRouter = router({
  /**
   * Run a full audit of all upgrades
   */
  runFullAudit: publicProcedure
    .input(z.object({
      createdBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await upgradeAuditor.runFullAudit(input.createdBy);
      return result;
    }),

  /**
   * Get all upgrade rules
   */
  getRules: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const rules = await db.select().from(upgradeRules).orderBy(upgradeRules.upgradeType, upgradeRules.category);
    
    // Group by upgrade type
    const grouped: Record<string, typeof rules> = {};
    for (const rule of rules) {
      if (!grouped[rule.upgradeType]) {
        grouped[rule.upgradeType] = [];
      }
      grouped[rule.upgradeType].push(rule);
    }
    
    return { rules, grouped };
  }),

  /**
   * Get all violations
   */
  getViolations: publicProcedure
    .input(z.object({
      resolved: z.boolean().optional(),
      severity: z.enum(["ERROR", "WARNING", "INFO"]).optional(),
      limit: z.number().min(1).max(1000).default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(upgradeViolations);

      if (input.resolved !== undefined) {
        query = query.where(eq(upgradeViolations.resolved, input.resolved)) as any;
      }

      if (input.severity) {
        query = query.where(eq(upgradeViolations.severity, input.severity)) as any;
      }

      const violations = await query.orderBy(desc(upgradeViolations.createdAt)).limit(input.limit);
      
      return violations;
    }),

  /**
   * Get violation statistics
   */
  getViolationStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allViolations = await db.select().from(upgradeViolations);
    
    const stats = {
      total: allViolations.length,
      resolved: allViolations.filter(v => v.resolved).length,
      unresolved: allViolations.filter(v => !v.resolved).length,
      bySeverity: {
        ERROR: allViolations.filter(v => v.severity === "ERROR").length,
        WARNING: allViolations.filter(v => v.severity === "WARNING").length,
        INFO: allViolations.filter(v => v.severity === "INFO").length,
      },
      byType: {} as Record<string, number>,
    };

    // Count by violation type
    for (const v of allViolations) {
      stats.byType[v.violationType] = (stats.byType[v.violationType] || 0) + 1;
    }

    return stats;
  }),

  /**
   * Resolve a violation
   */
  resolveViolation: publicProcedure
    .input(z.object({
      id: z.number(),
      resolvedBy: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(upgradeViolations)
        .set({
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: input.resolvedBy,
          notes: input.notes,
        })
        .where(eq(upgradeViolations.id, input.id));

      return { success: true };
    }),

  /**
   * Get audit history
   */
  getAuditHistory: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const audits = await db
        .select()
        .from(upgradeAudits)
        .orderBy(desc(upgradeAudits.startedAt))
        .limit(input.limit);

      return audits;
    }),

  /**
   * Get audit details
   */
  getAuditDetails: publicProcedure
    .input(z.object({
      auditId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [audit] = await db
        .select()
        .from(upgradeAudits)
        .where(eq(upgradeAudits.id, input.auditId))
        .limit(1);

      if (!audit) {
        throw new Error("Audit not found");
      }

      // Get violations from this audit (if we tracked audit ID in violations)
      // For now, just return the audit record
      return audit;
    }),
});
