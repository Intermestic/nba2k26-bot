/**
 * Reaction Roles Router
 * TRPC endpoints for managing reaction role panels and mappings
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db.js";
import { reactionRolePanels, reactionRoles } from '../../drizzle/schema.js';
import { eq, desc } from "drizzle-orm";

export const reactionRolesRouter = router({
  /**
   * Get all reaction role panels
   */
  getAllPanels: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const panels = await db.select().from(reactionRolePanels).orderBy(desc(reactionRolePanels.createdAt));
    
    // Get roles for each panel
    const panelsWithRoles = await Promise.all(
      panels.map(async (panel) => {
        const roles = await db.select().from(reactionRoles).where(eq(reactionRoles.panelId, panel.id));
        return { ...panel, roles };
      })
    );
    
    return panelsWithRoles;
  }),

  /**
   * Get single panel by ID
   */
  getPanelById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const panel = await db.select().from(reactionRolePanels).where(eq(reactionRolePanels.id, input.id));
      if (panel.length === 0) return null;
      
      const roles = await db.select().from(reactionRoles).where(eq(reactionRoles.panelId, input.id));
      
      return { ...panel[0], roles };
    }),

  /**
   * Create new reaction role panel
   */
  createPanel: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      channelId: z.string().min(1),
      title: z.string().min(1).max(256),
      description: z.string().optional(),
      embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      maxRoles: z.number().min(0).default(0),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(reactionRolePanels).values({
        ...input,
        createdBy: ctx.user.id,
      });
      
      return { success: true };
    }),

  /**
   * Update reaction role panel
   */
  updatePanel: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      channelId: z.string().min(1).optional(),
      title: z.string().min(1).max(256).optional(),
      description: z.string().optional(),
      embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      maxRoles: z.number().min(0).optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      
      await db.update(reactionRolePanels)
        .set(updates)
        .where(eq(reactionRolePanels.id, id));
      
      return { success: true };
    }),

  /**
   * Delete reaction role panel
   */
  deletePanel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Delete associated roles first
      await db.delete(reactionRoles).where(eq(reactionRoles.panelId, input.id));
      
      // Delete panel
      await db.delete(reactionRolePanels).where(eq(reactionRolePanels.id, input.id));
      
      return { success: true };
    }),

  /**
   * Add role to panel
   */
  addRole: protectedProcedure
    .input(z.object({
      panelId: z.number(),
      emoji: z.string().min(1).max(100),
      roleId: z.string().min(1),
      roleName: z.string().min(1).max(100),
      description: z.string().max(256).optional(),
      requiredRoleIds: z.string().optional(), // JSON array
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(reactionRoles).values(input);
      
      return { success: true };
    }),

  /**
   * Update role
   */
  updateRole: protectedProcedure
    .input(z.object({
      id: z.number(),
      emoji: z.string().min(1).max(100).optional(),
      roleId: z.string().min(1).optional(),
      roleName: z.string().min(1).max(100).optional(),
      description: z.string().max(256).optional(),
      requiredRoleIds: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      
      await db.update(reactionRoles)
        .set(updates)
        .where(eq(reactionRoles.id, id));
      
      return { success: true };
    }),

  /**
   * Delete role from panel
   */
  deleteRole: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(reactionRoles).where(eq(reactionRoles.id, input.id));
      
      return { success: true };
    }),

  /**
   * Post panel to Discord (creates/updates message)
   */
  postPanel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // This will be handled by Discord bot
      // Just return success and let bot handle posting
      return { success: true, message: "Panel will be posted to Discord" };
    }),

  /**
   * Toggle panel enabled status
   */
  togglePanel: protectedProcedure
    .input(z.object({
      id: z.number(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(reactionRolePanels)
        .set({ enabled: input.enabled })
        .where(eq(reactionRolePanels.id, input.id));
      
      return { success: true };
    }),
});
