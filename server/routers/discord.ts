import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { postToDiscord, updateDiscordMessage } from "../discord";

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
});
