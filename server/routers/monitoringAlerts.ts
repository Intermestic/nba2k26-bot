import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { monitoringAlerts } from "../../shared/schema";
import { eq } from "drizzle-orm";

export const monitoringAlertsRouter = router({
  // Get alert configuration
  getConfig: publicProcedure
    .input(
      z.object({
        alertType: z.string().default("bot_offline"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(monitoringAlerts)
        .where(eq(monitoringAlerts.alertType, input.alertType))
        .limit(1);

      if (result.length === 0) {
        // Return default config if none exists
        return {
          id: 0,
          alertType: input.alertType,
          isEnabled: false,
          webhookUrl: null,
          alertFrequency: "immediate",
          lastTriggered: null,
          status: "active",
        };
      }

      return result[0];
    }),

  // Update alert configuration
  updateConfig: publicProcedure
    .input(
      z.object({
        alertType: z.string(),
        isEnabled: z.boolean(),
        webhookUrl: z.string().url().optional(),
        alertFrequency: z.enum(["immediate", "5min", "15min", "1hr"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if config exists
      const existing = await db
        .select()
        .from(monitoringAlerts)
        .where(eq(monitoringAlerts.alertType, input.alertType))
        .limit(1);

      if (existing.length === 0) {
        // Create new config
        await db.insert(monitoringAlerts).values({
          alertType: input.alertType,
          isEnabled: input.isEnabled,
          webhookUrl: input.webhookUrl || null,
          alertFrequency: input.alertFrequency,
          status: "active",
        });
      } else {
        // Update existing config
        await db
          .update(monitoringAlerts)
          .set({
            isEnabled: input.isEnabled,
            webhookUrl: input.webhookUrl || null,
            alertFrequency: input.alertFrequency,
            updatedAt: new Date(),
          })
          .where(eq(monitoringAlerts.id, existing[0].id));
      }

      return { success: true };
    }),

  // Test webhook
  testWebhook: publicProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(input.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: "🧪 **Test Alert**\nThis is a test message from your NBA 2K League bot monitoring system.",
            embeds: [
              {
                title: "Test Webhook",
                description: "If you see this message, your webhook is configured correctly!",
                color: 0x00ff00, // Green
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned status ${response.status}`);
        }

        return { success: true, message: "Test message sent successfully!" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Failed to send test message",
        };
      }
    }),

  // Send alert (used by monitoring service)
  sendAlert: publicProcedure
    .input(
      z.object({
        alertType: z.string(),
        title: z.string(),
        message: z.string(),
        severity: z.enum(["info", "warning", "error"]).default("error"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get alert config
      const config = await db
        .select()
        .from(monitoringAlerts)
        .where(eq(monitoringAlerts.alertType, input.alertType))
        .limit(1);

      if (config.length === 0 || !config[0].isEnabled || !config[0].webhookUrl) {
        return { success: false, message: "Alert not configured or disabled" };
      }

      const alertConfig = config[0];

      // Check frequency throttling
      if (alertConfig.lastTriggered) {
        const now = new Date();
        const lastTriggered = new Date(alertConfig.lastTriggered);
        const minutesSinceLastAlert = (now.getTime() - lastTriggered.getTime()) / 60000;

        let minMinutes = 0;
        if (alertConfig.alertFrequency === "5min") minMinutes = 5;
        else if (alertConfig.alertFrequency === "15min") minMinutes = 15;
        else if (alertConfig.alertFrequency === "1hr") minMinutes = 60;

        if (minMinutes > 0 && minutesSinceLastAlert < minMinutes) {
          return {
            success: false,
            message: `Alert throttled. Next alert allowed in ${Math.ceil(minMinutes - minutesSinceLastAlert)} minutes`,
          };
        }
      }

      // Send webhook
      try {
        if (!alertConfig.webhookUrl) {
          return { success: false, message: "Webhook URL not configured" };
        }

        const colorMap = {
          info: 0x3b82f6, // Blue
          warning: 0xf59e0b, // Orange
          error: 0xef4444, // Red
        };

        const response = await fetch(alertConfig.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `🚨 **${input.title}**`,
            embeds: [
              {
                title: input.title,
                description: input.message,
                color: colorMap[input.severity],
                timestamp: new Date().toISOString(),
                footer: {
                  text: `Alert Type: ${input.alertType}`,
                },
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned status ${response.status}`);
        }

        // Update last triggered time
        await db
          .update(monitoringAlerts)
          .set({
            lastTriggered: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(monitoringAlerts.id, alertConfig.id));

        return { success: true, message: "Alert sent successfully" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Failed to send alert",
        };
      }
    }),
});
