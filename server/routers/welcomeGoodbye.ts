/**
 * Welcome & Goodbye Messages Router
 * TRPC endpoints for managing welcome and goodbye message configuration
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db.js";
import { welcomeConfig, goodbyeConfig } from '../../drizzle/schema.js';
import { eq } from "drizzle-orm";

export const welcomeGoodbyeRouter = router({
  /**
   * Get welcome configuration
   */
  getWelcomeConfig: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db.select().from(welcomeConfig).limit(1);
    return result[0] || null;
  }),

  /**
   * Get goodbye configuration
   */
  getGoodbyeConfig: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db.select().from(goodbyeConfig).limit(1);
    return result[0] || null;
  }),

  /**
   * Update or create welcome configuration
   */
  updateWelcomeConfig: protectedProcedure
    .input(z.object({
      enabled: z.boolean(),
      channelId: z.string().min(1),
      messageType: z.enum(["text", "embed", "card"]),
      messageContent: z.string().min(1),
      embedTitle: z.string().optional(),
      embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      embedImageUrl: z.string().url().optional().or(z.literal("")),
      dmEnabled: z.boolean(),
      dmContent: z.string().optional(),
      autoRoleIds: z.string().optional(), // JSON array of role IDs
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if config exists
      const existing = await db.select().from(welcomeConfig).limit(1);
      
      if (existing.length > 0) {
        // Update existing
        await db.update(welcomeConfig)
          .set({
            ...input,
            updatedBy: ctx.user.id,
          })
          .where(eq(welcomeConfig.id, existing[0].id));
      } else {
        // Create new
        await db.insert(welcomeConfig).values({
          ...input,
          updatedBy: ctx.user.id,
        });
      }
      
      return { success: true };
    }),

  /**
   * Update or create goodbye configuration
   */
  updateGoodbyeConfig: protectedProcedure
    .input(z.object({
      enabled: z.boolean(),
      channelId: z.string().min(1),
      messageType: z.enum(["text", "embed"]),
      messageContent: z.string().min(1),
      embedTitle: z.string().optional(),
      embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if config exists
      const existing = await db.select().from(goodbyeConfig).limit(1);
      
      if (existing.length > 0) {
        // Update existing
        await db.update(goodbyeConfig)
          .set({
            ...input,
            updatedBy: ctx.user.id,
          })
          .where(eq(goodbyeConfig.id, existing[0].id));
      } else {
        // Create new
        await db.insert(goodbyeConfig).values({
          ...input,
          updatedBy: ctx.user.id,
        });
      }
      
      return { success: true };
    }),

  /**
   * Toggle welcome enabled status
   */
  toggleWelcome: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db.select().from(welcomeConfig).limit(1);
      if (existing.length === 0) {
        throw new Error("Welcome config not found. Please create it first.");
      }
      
      await db.update(welcomeConfig)
        .set({ enabled: input.enabled })
        .where(eq(welcomeConfig.id, existing[0].id));
      
      return { success: true };
    }),

  /**
   * Toggle goodbye enabled status
   */
  toggleGoodbye: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db.select().from(goodbyeConfig).limit(1);
      if (existing.length === 0) {
        throw new Error("Goodbye config not found. Please create it first.");
      }
      
      await db.update(goodbyeConfig)
        .set({ enabled: input.enabled })
        .where(eq(goodbyeConfig.id, existing[0].id));
      
      return { success: true };
    }),
});
