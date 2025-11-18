import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { discordConfig } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDiscordBotStatus, postCapStatusToChannel, updateCapStatusMessage } from "../discord-bot";

export const discordRouter = router({
  // Post new cap status message using bot
  postCapStatus: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        websiteUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<{ success: boolean; messageId: string | null; teamCount: number }> => {
      // Only admins can post to Discord
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const result = await postCapStatusToChannel(input.channelId, input.websiteUrl);
      
      // Save message ID to config
      const db = await getDb();
      if (db && result.messageId) {
        const existing = await db.select().from(discordConfig).limit(1);
        if (existing.length > 0) {
          await db
            .update(discordConfig)
            .set({
              messageId: result.messageId,
              lastUpdated: new Date(),
            })
            .where(eq(discordConfig.id, existing[0].id));
        }
      }
      
      return result;
    }),

  // Update existing Discord message using bot
  updateCapStatus: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        messageId: z.string(),
        websiteUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<{ success: boolean; teamCount: number }> => {
      // Only admins can update Discord messages
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const result = await updateCapStatusMessage(
        input.channelId,
        input.messageId,
        input.websiteUrl
      );
      
      // Update last updated timestamp
      const db = await getDb();
      if (db) {
        const existing = await db.select().from(discordConfig).limit(1);
        if (existing.length > 0) {
          await db
            .update(discordConfig)
            .set({
              lastUpdated: new Date(),
            })
            .where(eq(discordConfig.id, existing[0].id));
        }
      }
      
      return result;
    }),

  // Get Discord configuration
  getConfig: protectedProcedure.query(async ({ ctx }): Promise<any> => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const configs = await db.select().from(discordConfig).limit(1);
    return configs[0] || null;
  }),

  // Save Discord configuration
  saveConfig: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        messageId: z.string().optional(),
        websiteUrl: z.string().url(),
        autoUpdateEnabled: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<{ success: boolean }> => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(discordConfig).limit(1);

      if (existing.length > 0) {
        // Update existing config
        await db
          .update(discordConfig)
          .set({
            channelId: input.channelId,
            messageId: input.messageId || null,
            websiteUrl: input.websiteUrl,
            autoUpdateEnabled: input.autoUpdateEnabled ? 1 : 0,
            updatedAt: new Date(),
          })
          .where(eq(discordConfig.id, existing[0].id));
      } else {
        // Insert new config
        await db.insert(discordConfig).values({
          channelId: input.channelId,
          messageId: input.messageId || null,
          websiteUrl: input.websiteUrl,
          autoUpdateEnabled: input.autoUpdateEnabled ? 1 : 0,
        });
      }

      return { success: true };
    }),

  // Get Discord bot status
  getBotStatus: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can check bot status
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return getDiscordBotStatus();
  }),
});
