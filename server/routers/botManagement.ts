/**
 * Bot Management Router
 * TRPC endpoints for managing Discord bot configuration
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { botConfig, messageTemplates, botCommands } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const botManagementRouter = router({
  // ==================== BOT CONFIG ====================
  
  /**
   * Get all bot configuration settings
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return await db.select().from(botConfig);
  }),

  /**
   * Get a single config value by key
   */
  getConfigByKey: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.select().from(botConfig).where(eq(botConfig.key, input.key));
      return result[0] || null;
    }),

  /**
   * Update or create a config value
   */
  upsertConfig: protectedProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
      description: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if exists
      const existing = await db.select().from(botConfig).where(eq(botConfig.key, input.key));
      
      if (existing.length > 0) {
        // Update
        await db.update(botConfig)
          .set({
            value: input.value,
            description: input.description,
            category: input.category,
            updatedBy: ctx.user.id,
          })
          .where(eq(botConfig.key, input.key));
      } else {
        // Insert
        await db.insert(botConfig).values({
          key: input.key,
          value: input.value,
          description: input.description,
          category: input.category,
          updatedBy: ctx.user.id,
        });
      }
      
      return { success: true };
    }),

  /**
   * Delete a config entry
   */
  deleteConfig: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(botConfig).where(eq(botConfig.key, input.key));
      return { success: true };
    }),

  // ==================== MESSAGE TEMPLATES ====================
  
  /**
   * Get all message templates
   */
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return await db.select().from(messageTemplates);
  }),

  /**
   * Get a single template by key
   */
  getTemplateByKey: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.select().from(messageTemplates).where(eq(messageTemplates.key, input.key));
      return result[0] || null;
    }),

  /**
   * Update or create a message template
   */
  upsertTemplate: protectedProcedure
    .input(z.object({
      key: z.string(),
      content: z.string(),
      description: z.string().optional(),
      category: z.string().optional(),
      variables: z.string().optional(), // JSON string of available variables
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if exists
      const existing = await db.select().from(messageTemplates).where(eq(messageTemplates.key, input.key));
      
      if (existing.length > 0) {
        // Update
        await db.update(messageTemplates)
          .set({
            content: input.content,
            description: input.description,
            category: input.category,
            variables: input.variables,
            updatedBy: ctx.user.id,
          })
          .where(eq(messageTemplates.key, input.key));
      } else {
        // Insert
        await db.insert(messageTemplates).values({
          key: input.key,
          content: input.content,
          description: input.description,
          category: input.category,
          variables: input.variables,
          updatedBy: ctx.user.id,
        });
      }
      
      return { success: true };
    }),

  /**
   * Delete a message template
   */
  deleteTemplate: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(messageTemplates).where(eq(messageTemplates.key, input.key));
      return { success: true };
    }),

  // ==================== BOT COMMANDS ====================
  
  /**
   * Get all bot commands
   */
  getCommands: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return await db.select().from(botCommands);
  }),

  /**
   * Get a single command by command string
   */
  getCommandByName: protectedProcedure
    .input(z.object({ command: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.select().from(botCommands).where(eq(botCommands.command, input.command));
      return result[0] || null;
    }),

  /**
   * Update or create a bot command
   */
  upsertCommand: protectedProcedure
    .input(z.object({
      command: z.string(),
      description: z.string(),
      enabled: z.boolean().optional(),
      responseTemplate: z.string().optional(),
      permissions: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if exists
      const existing = await db.select().from(botCommands).where(eq(botCommands.command, input.command));
      
      if (existing.length > 0) {
        // Update
        await db.update(botCommands)
          .set({
            description: input.description,
            enabled: input.enabled,
            responseTemplate: input.responseTemplate,
            permissions: input.permissions,
            category: input.category,
            updatedBy: ctx.user.id,
          })
          .where(eq(botCommands.command, input.command));
      } else {
        // Insert
        await db.insert(botCommands).values({
          command: input.command,
          description: input.description,
          enabled: input.enabled ?? true,
          responseTemplate: input.responseTemplate,
          permissions: input.permissions,
          category: input.category,
          updatedBy: ctx.user.id,
        });
      }
      
      return { success: true };
    }),

  /**
   * Toggle command enabled status
   */
  toggleCommand: protectedProcedure
    .input(z.object({
      command: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(botCommands)
        .set({
          enabled: input.enabled,
          updatedBy: ctx.user.id,
        })
        .where(eq(botCommands.command, input.command));
      
      return { success: true };
    }),

  /**
   * Delete a bot command
   */
  deleteCommand: protectedProcedure
    .input(z.object({ command: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(botCommands).where(eq(botCommands.command, input.command));
      return { success: true };
    }),
});
