import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { postToDiscord, updateDiscordMessage } from "../discord";
import { getDb } from "../db";
import { discordConfig } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const discordRouter = router({
  // Post new embed to Discord
  postCapStatus: protectedProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
        websiteUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<{ success: boolean; teamCount: number }> => {
      // Only admins can post to Discord
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const result = await postToDiscord(input.webhookUrl, input.websiteUrl);
      return result;
    }),

  // Update existing Discord message
  updateCapStatus: protectedProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
        messageId: z.string(),
        websiteUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<{ success: boolean; teamCount: number }> => {
      // Only admins can update Discord messages
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const result = await updateDiscordMessage(
        input.webhookUrl,
        input.messageId,
        input.websiteUrl
      );
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
        webhookUrl: z.string().url(),
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
            webhookUrl: input.webhookUrl,
            messageId: input.messageId || null,
            websiteUrl: input.websiteUrl,
            autoUpdateEnabled: input.autoUpdateEnabled ? 1 : 0,
            updatedAt: new Date(),
          })
          .where(eq(discordConfig.id, existing[0].id));
      } else {
        // Insert new config
        await db.insert(discordConfig).values({
          webhookUrl: input.webhookUrl,
          messageId: input.messageId || null,
          websiteUrl: input.websiteUrl,
          autoUpdateEnabled: input.autoUpdateEnabled ? 1 : 0,
        });
      }

      return { success: true };
    }),
});
