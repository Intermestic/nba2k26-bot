/**
 * Custom Commands Router
 * TRPC endpoints for managing user-created bot commands
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db.js";
import { customCommands, commandCooldowns } from '../../drizzle/schema.js';
import { eq, desc, like, or } from "drizzle-orm";

export const customCommandsRouter = router({
  /**
   * Get all custom commands
   */
  getAll: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(customCommands).orderBy(desc(customCommands.createdAt));
      
      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        query = query.where(
          or(
            like(customCommands.trigger, searchTerm),
            like(customCommands.response, searchTerm)
          )
        ) as any;
      }
      
      return await query;
    }),

  /**
   * Get single command by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.select().from(customCommands).where(eq(customCommands.id, input.id));
      return result[0] || null;
    }),

  /**
   * Create new custom command
   */
  create: protectedProcedure
    .input(z.object({
      trigger: z.string().min(1).max(100),
      response: z.string().min(1),
      responseType: z.enum(["text", "embed", "reaction"]).default("text"),
      embedTitle: z.string().max(256).optional(),
      embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      cooldownSeconds: z.number().min(0).default(0),
      cooldownType: z.enum(["user", "channel", "global"]).default("user"),
      permissionLevel: z.enum(["everyone", "role", "admin"]).default("everyone"),
      requiredRoleIds: z.string().optional(), // JSON array
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if trigger already exists
      const existing = await db.select().from(customCommands).where(eq(customCommands.trigger, input.trigger));
      if (existing.length > 0) {
        throw new Error(`Command trigger "${input.trigger}" already exists`);
      }
      
      // Insert new command
      await db.insert(customCommands).values({
        ...input,
        createdBy: ctx.user.id,
      });
      
      return { success: true };
    }),

  /**
   * Update existing custom command
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      trigger: z.string().min(1).max(100).optional(),
      response: z.string().min(1).optional(),
      responseType: z.enum(["text", "embed", "reaction"]).optional(),
      embedTitle: z.string().max(256).optional(),
      embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      cooldownSeconds: z.number().min(0).optional(),
      cooldownType: z.enum(["user", "channel", "global"]).optional(),
      permissionLevel: z.enum(["everyone", "role", "admin"]).optional(),
      requiredRoleIds: z.string().optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      
      // Check if trigger is being changed and if it conflicts
      if (updates.trigger) {
        const existing = await db.select().from(customCommands)
          .where(eq(customCommands.trigger, updates.trigger));
        if (existing.length > 0 && existing[0].id !== id) {
          throw new Error(`Command trigger "${updates.trigger}" already exists`);
        }
      }
      
      await db.update(customCommands)
        .set(updates)
        .where(eq(customCommands.id, id));
      
      return { success: true };
    }),

  /**
   * Toggle command enabled status
   */
  toggleEnabled: protectedProcedure
    .input(z.object({
      id: z.number(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(customCommands)
        .set({ enabled: input.enabled })
        .where(eq(customCommands.id, input.id));
      
      return { success: true };
    }),

  /**
   * Delete custom command
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Delete associated cooldowns first
      await db.delete(commandCooldowns).where(eq(commandCooldowns.commandId, input.id));
      
      // Delete command
      await db.delete(customCommands).where(eq(customCommands.id, input.id));
      
      return { success: true };
    }),

  /**
   * Increment use count (called by bot when command is used)
   */
  incrementUseCount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const command = await db.select().from(customCommands).where(eq(customCommands.id, input.id));
      if (command.length === 0) return { success: false };
      
      await db.update(customCommands)
        .set({ useCount: (command[0].useCount || 0) + 1 })
        .where(eq(customCommands.id, input.id));
      
      return { success: true };
    }),

  /**
   * Get command statistics
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const commands = await db.select().from(customCommands);
    
    const totalCommands = commands.length;
    const enabledCommands = commands.filter(c => c.enabled).length;
    const totalUses = commands.reduce((sum, c) => sum + (c.useCount || 0), 0);
    const mostUsed = commands.sort((a, b) => (b.useCount || 0) - (a.useCount || 0)).slice(0, 5);
    
    return {
      totalCommands,
      enabledCommands,
      totalUses,
      mostUsed,
    };
  }),
});
