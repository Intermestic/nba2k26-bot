import { z } from "zod";
import { eq } from "drizzle-orm";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { upgradeTemplates } from "../../drizzle/schema";

const upgradeSchema = z.object({
  badge: z.string(),
  tier: z.string().optional(),
  attributes: z.string().optional(),
});

export const templatesRouter = router({
  // Get all templates (optionally filtered by category)
  getAll: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(upgradeTemplates);
      
      if (input?.category) {
        query = query.where(eq(upgradeTemplates.category, input.category)) as any;
      }

      const templates = await query;
      return templates;
    }),

  // Get template by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(upgradeTemplates)
        .where(eq(upgradeTemplates.id, input.id))
        .limit(1);

      return template;
    }),

  // Get template by name
  getByName: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(upgradeTemplates)
        .where(eq(upgradeTemplates.name, input.name))
        .limit(1);

      return template;
    }),

  // Get all unique categories
  getCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const templates = await db.select().from(upgradeTemplates);
    const categorySet = new Set(templates.map((t) => t.category));
    const categories = Array.from(categorySet);
    return categories.sort();
  }),

  // Create template (admin only)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        displayName: z.string().min(1),
        description: z.string().optional(),
        category: z.string().min(1),
        upgrades: z.array(upgradeSchema),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(upgradeTemplates).values({
        name: input.name,
        displayName: input.displayName,
        description: input.description,
        category: input.category,
        upgrades: input.upgrades as any,
        createdBy: ctx.user.id,
      });

      return { success: true, id: result.insertId };
    }),

  // Update template (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        displayName: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().min(1).optional(),
        upgrades: z.array(upgradeSchema).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.displayName !== undefined) updateData.displayName = input.displayName;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.upgrades !== undefined) updateData.upgrades = input.upgrades;

      await db
        .update(upgradeTemplates)
        .set(updateData)
        .where(eq(upgradeTemplates.id, input.id));

      return { success: true };
    }),

  // Delete template (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(upgradeTemplates).where(eq(upgradeTemplates.id, input.id));

      return { success: true };
    }),
});
