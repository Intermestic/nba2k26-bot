/**
 * Bot Management Router
 * TRPC endpoints for managing Discord bot configuration
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { botConfig, messageTemplates, botCommands, scheduledMessages } from "../../drizzle/schema";
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

  // ==================== SCHEDULED MESSAGES ====================
  
  /**
   * Get all scheduled messages
   */
  getScheduledMessages: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return await db.select().from(scheduledMessages);
  }),

  /**
   * Get a single scheduled message by ID
   */
  getScheduledMessageById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.select().from(scheduledMessages).where(eq(scheduledMessages.id, input.id));
      return result[0] || null;
    }),

  /**
   * Create or update a scheduled message
   */
  upsertScheduledMessage: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string(),
      channelId: z.string(),
      message: z.string(),
      schedule: z.string(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (input.id) {
        // Update existing
        await db
          .update(scheduledMessages)
          .set({
            name: input.name,
            channelId: input.channelId,
            message: input.message,
            schedule: input.schedule,
            enabled: input.enabled ?? true,
          })
          .where(eq(scheduledMessages.id, input.id));
        return { success: true, id: input.id };
      } else {
        // Create new
        const result: any = await db.insert(scheduledMessages).values({
          name: input.name,
          channelId: input.channelId,
          message: input.message,
          schedule: input.schedule,
          enabled: input.enabled ?? true,
          createdBy: ctx.user.id,
        });
        return { success: true, id: result.insertId || 0 };
      }
    }),

  /**
   * Toggle scheduled message enabled status
   */
  toggleScheduledMessage: protectedProcedure
    .input(z.object({ id: z.number(), enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(scheduledMessages)
        .set({ enabled: input.enabled })
        .where(eq(scheduledMessages.id, input.id));
      return { success: true };
    }),

  /**
   * Delete a scheduled message
   */
  deleteScheduledMessage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(scheduledMessages).where(eq(scheduledMessages.id, input.id));
      return { success: true };
    }),

  /**
   * Test send a scheduled message (immediate send to verify content)
   */
  testScheduledMessage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const message = await db.select().from(scheduledMessages).where(eq(scheduledMessages.id, input.id));
      if (!message[0]) throw new Error("Message not found");
      
      // TODO: Implement test send via Discord bot
      // For now, just return success
      console.log('[Test Send] Would send to channel:', message[0].channelId);
      console.log('[Test Send] Message:', message[0].message);
      
      return { success: true };
    }),
});
