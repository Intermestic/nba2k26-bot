import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { validationRules } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const validationRulesRouter = router({
  // Get all validation rules
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const rules = await db.select().from(validationRules).orderBy(validationRules.ruleName);
    return rules;
  }),

  // Get single validation rule by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const rule = await db.select().from(validationRules).where(eq(validationRules.id, input.id)).limit(1);
      if (rule.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Validation rule not found" });
      }
      return rule[0];
    }),

  // Create new validation rule (admin only)
  create: protectedProcedure
    .input(
      z.object({
        ruleName: z.string().min(1).max(100),
        ruleType: z.enum(["game_requirement", "attribute_check", "badge_limit", "cooldown"]),
        enabled: z.boolean().default(true),
        config: z.string(), // JSON string
        errorMessage: z.string().optional(),
        severity: z.enum(["error", "warning"]).default("error"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validate JSON config
      try {
        JSON.parse(input.config);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid JSON in config field" });
      }

      const result = await db.insert(validationRules).values({
        ...input,
        createdBy: ctx.user.id,
      });

      return { success: true, id: Number((result as any).insertId) };
    }),

  // Update existing validation rule (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        ruleName: z.string().min(1).max(100).optional(),
        ruleType: z.enum(["game_requirement", "attribute_check", "badge_limit", "cooldown"]).optional(),
        enabled: z.boolean().optional(),
        config: z.string().optional(), // JSON string
        errorMessage: z.string().optional(),
        severity: z.enum(["error", "warning"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validate JSON config if provided
      if (input.config) {
        try {
          JSON.parse(input.config);
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid JSON in config field" });
        }
      }

      const { id, ...updateData } = input;
      await db.update(validationRules).set(updateData).where(eq(validationRules.id, id));

      return { success: true };
    }),

  // Delete validation rule (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(validationRules).where(eq(validationRules.id, input.id));

      return { success: true };
    }),

  // Toggle enabled status (admin only)
  toggleEnabled: protectedProcedure
    .input(z.object({ id: z.number(), enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(validationRules).set({ enabled: input.enabled }).where(eq(validationRules.id, input.id));

      return { success: true };
    }),
});
