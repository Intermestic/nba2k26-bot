import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { validationRules } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const validationRulesRouter = router({
  // Get all validation rules
  getAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rules = await db.select().from(validationRules);
    return rules;
  }),

  // Get a single rule by key
  getByKey: protectedProcedure
    .input(z.object({ ruleKey: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const rule = await db
        .select()
        .from(validationRules)
        .where(eq(validationRules.ruleKey, input.ruleKey))
        .limit(1);

      return rule[0] || null;
    }),

  // Update a rule
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        enabled: z.number().min(0).max(1).optional(),
        numericValue: z.number().nullable().optional(),
        textValue: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      await db
        .update(validationRules)
        .set(updates)
        .where(eq(validationRules.id, id));

      return { success: true };
    }),

  // Toggle rule enabled/disabled
  toggle: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current state
      const rule = await db
        .select()
        .from(validationRules)
        .where(eq(validationRules.id, input.id))
        .limit(1);

      if (!rule[0]) throw new Error("Rule not found");

      const newEnabled = rule[0].enabled === 1 ? 0 : 1;

      await db
        .update(validationRules)
        .set({ enabled: newEnabled })
        .where(eq(validationRules.id, input.id));

      return { success: true, enabled: newEnabled };
    }),
});
