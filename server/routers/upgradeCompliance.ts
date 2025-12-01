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
   * Flag a violation for admin review and send Discord notification
   */
  flagViolation: publicProcedure
    .input(z.object({
      id: z.number(),
      flaggedBy: z.string(),
      flagNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get violation details
      const violation = await db.select().from(upgradeViolations).where(eq(upgradeViolations.id, input.id)).limit(1);
      if (!violation || violation.length === 0) {
        throw new Error("Violation not found");
      }

      // Update violation with flagged status
      await db.update(upgradeViolations)
        .set({
          flagged: true,
          flaggedAt: new Date(),
          flaggedBy: input.flaggedBy,
          flagNotes: input.flagNotes,
        })
        .where(eq(upgradeViolations.id, input.id));

      // Send Discord notification
      const { getDiscordClient } = await import("../discord-bot");
      const client = getDiscordClient();
      
      if (client) {
        try {
          const channelId = "1149106208498790500";
          const channel = await client.channels.fetch(channelId);
          
          if (channel && channel.isTextBased() && 'send' in channel) {
            const v = violation[0];
            const message = `<@&Admin> **Upgrade Compliance Violation Flagged**\n\n` +
              `**Player:** ${v.playerName || "Unknown"}\n` +
              `**Upgrade Type:** ${v.upgradeType}\n` +
              `**Violation:** ${v.violationType}\n` +
              `**Rule Violated:** ${v.ruleViolated}\n` +
              `**Details:** ${v.details}\n` +
              `**Severity:** ${v.severity}\n` +
              `**Flagged By:** ${input.flaggedBy}\n` +
              `**Notes:** ${input.flagNotes || "None"}\n\n` +
              `Please review and take appropriate action to remove this improper upgrade.`;

            await channel.send(message);
          }
        } catch (error) {
          console.error('[Upgrade Compliance] Failed to send Discord notification:', error);
        }
      }

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
