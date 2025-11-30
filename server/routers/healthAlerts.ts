import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { healthAlerts, alertHistory } from "../../drizzle/schema.js";
import { desc, eq, and, gte } from "drizzle-orm";
import { Client } from "discord.js";

// Store health check interval
let healthCheckInterval: NodeJS.Timeout | null = null;
let lastErrorCount = 0;
let consecutiveErrors = 0;

/**
 * Get Discord client instance from bot
 */
async function getDiscordClient(): Promise<Client | null> {
  try {
    // Import bot instance from discord-bot.ts
    const { getDiscordClient: getBotClient } = await import("../discord-bot.js");
    return getBotClient();
  } catch (error) {
    console.error("[Health Alerts] Failed to get Discord client:", error);
    return null;
  }
}

/**
 * Check bot health status
 */
async function checkBotHealth(): Promise<{
  isOnline: boolean;
  uptime: number | null;
  errorCount: number;
  latency: number | null;
}> {
  const client = await getDiscordClient();
  
  if (!client || !client.isReady()) {
    return {
      isOnline: false,
      uptime: null,
      errorCount: 0,
      latency: null,
    };
  }

  return {
    isOnline: true,
    uptime: client.uptime || 0,
    errorCount: 0, // Could track this from bot logs
    latency: client.ws.ping,
  };
}

/**
 * Send alert to Discord channel
 */
async function sendDiscordAlert(
  channelId: string,
  alertType: "offline" | "error" | "recovery",
  message: string,
  details?: any
): Promise<string | null> {
  try {
    const client = await getDiscordClient();
    if (!client || !client.isReady()) {
      console.error("[Health Alerts] Cannot send alert - bot is offline");
      return null;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      console.error("[Health Alerts] Invalid channel ID:", channelId);
      return null;
    }

    // Format embed based on alert type
    const colors = {
      offline: 0xff0000, // Red
      error: 0xffa500, // Orange
      recovery: 0x00ff00, // Green
    };

    const embed = {
      title: `🚨 Bot Health Alert: ${alertType.toUpperCase()}`,
      description: message,
      color: colors[alertType],
      fields: details
        ? Object.entries(details).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true,
          }))
        : [],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Bot Health Monitoring System",
      },
    };

    const sentMessage = await channel.send({ embeds: [embed] });
    return sentMessage.id;
  } catch (error) {
    console.error("[Health Alerts] Failed to send Discord alert:", error);
    return null;
  }
}

/**
 * Run health check and send alerts if needed
 */
async function runHealthCheck() {
  const db = await getDb();

  // Get alert configuration
  const configs = await db
    .select()
    .from(healthAlerts)
    .where(eq(healthAlerts.enabled, 1))
    .limit(1);

  if (configs.length === 0) {
    return; // No active alert configuration
  }

  const config = configs[0];

  // Check bot health
  const health = await checkBotHealth();

  // Update last health check time
  await db
    .update(healthAlerts)
    .set({ lastHealthCheck: new Date() })
    .where(eq(healthAlerts.id, config.id));

  // Check for offline status
  if (!health.isOnline && config.offlineAlertEnabled) {
    // Check if we already sent an offline alert recently (within 5 minutes)
    const recentAlerts = await db
      .select()
      .from(alertHistory)
      .where(
        and(
          eq(alertHistory.alertType, "offline"),
          eq(alertHistory.resolved, 0),
          gte(alertHistory.createdAt, new Date(Date.now() - 5 * 60 * 1000))
        )
      )
      .limit(1);

    if (recentAlerts.length === 0) {
      // Send offline alert
      const discordMessageId = await sendDiscordAlert(
        config.alertChannelId,
        "offline",
        "⚠️ Discord bot is currently offline or unreachable",
        {
          "Last Check": new Date().toLocaleString(),
          Status: "Offline",
        }
      );

      // Log alert
      await db.insert(alertHistory).values({
        alertType: "offline",
        message: "Bot is offline",
        details: JSON.stringify(health),
        discordMessageId: discordMessageId || undefined,
        resolved: 0,
      });

      console.log("[Health Alerts] Sent offline alert");
    }
  }

  // Check for recovery (bot came back online)
  if (health.isOnline) {
    // Check if there are unresolved offline alerts
    const unresolvedAlerts = await db
      .select()
      .from(alertHistory)
      .where(
        and(
          eq(alertHistory.alertType, "offline"),
          eq(alertHistory.resolved, 0)
        )
      );

    if (unresolvedAlerts.length > 0) {
      // Send recovery alert
      const discordMessageId = await sendDiscordAlert(
        config.alertChannelId,
        "recovery",
        "✅ Discord bot is back online and operational",
        {
          "Uptime": `${Math.floor((health.uptime || 0) / 1000 / 60)} minutes`,
          "Latency": `${health.latency || 0}ms`,
          Status: "Online",
        }
      );

      // Mark offline alerts as resolved
      for (const alert of unresolvedAlerts) {
        await db
          .update(alertHistory)
          .set({
            resolved: 1,
            resolvedAt: new Date(),
          })
          .where(eq(alertHistory.id, alert.id));
      }

      // Log recovery
      await db.insert(alertHistory).values({
        alertType: "recovery",
        message: "Bot is back online",
        details: JSON.stringify(health),
        discordMessageId: discordMessageId || undefined,
        resolved: 1,
        resolvedAt: new Date(),
      });

      console.log("[Health Alerts] Sent recovery alert");
    }

    // Reset consecutive error counter
    consecutiveErrors = 0;
  }

  // Check for error threshold (if implemented)
  if (health.errorCount > lastErrorCount && config.errorAlertEnabled) {
    consecutiveErrors++;

    if (consecutiveErrors >= config.errorThreshold) {
      // Send error alert
      const discordMessageId = await sendDiscordAlert(
        config.alertChannelId,
        "error",
        `⚠️ Bot has encountered ${consecutiveErrors} consecutive errors`,
        {
          "Error Count": consecutiveErrors,
          Threshold: config.errorThreshold,
          "Last Check": new Date().toLocaleString(),
        }
      );

      // Log alert
      await db.insert(alertHistory).values({
        alertType: "error",
        message: `${consecutiveErrors} consecutive errors detected`,
        details: JSON.stringify({ errorCount: consecutiveErrors }),
        discordMessageId: discordMessageId || undefined,
        resolved: 0,
      });

      console.log("[Health Alerts] Sent error threshold alert");

      // Reset counter after alerting
      consecutiveErrors = 0;
    }
  }

  lastErrorCount = health.errorCount;
}

/**
 * Start health monitoring
 */
async function startHealthMonitoring() {
  const db = await getDb();

  // Get alert configuration
  const configs = await db
    .select()
    .from(healthAlerts)
    .where(eq(healthAlerts.enabled, 1))
    .limit(1);

  if (configs.length === 0) {
    console.log("[Health Alerts] No active configuration found");
    return;
  }

  const config = configs[0];

  // Stop existing interval if any
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }

  // Start new interval
  const intervalMs = config.checkIntervalSeconds * 1000;
  healthCheckInterval = setInterval(() => {
    runHealthCheck().catch(console.error);
  }, intervalMs);

  // Run initial check
  runHealthCheck().catch(console.error);

  console.log(
    `[Health Alerts] Monitoring started - checking every ${config.checkIntervalSeconds} seconds`
  );
}

// Initialize health monitoring on module load
startHealthMonitoring().catch(console.error);

export const healthAlertsRouter = router({
  // Get current alert configuration
  getConfig: publicProcedure.query(async () => {
    const db = await getDb();

    const configs = await db
      .select()
      .from(healthAlerts)
      .orderBy(desc(healthAlerts.id))
      .limit(1);

    if (configs.length === 0) {
      return null;
    }

    const config = configs[0];

    // Get current bot status
    const health = await checkBotHealth();

    return {
      ...config,
      currentStatus: health,
      isMonitoring: healthCheckInterval !== null,
    };
  }),

  // Update alert configuration
  updateConfig: publicProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        alertChannelId: z.string(),
        offlineAlertEnabled: z.boolean(),
        errorAlertEnabled: z.boolean(),
        errorThreshold: z.number().min(1).max(100),
        checkIntervalSeconds: z.number().min(30).max(3600),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Check if config exists
      const existing = await db.select().from(healthAlerts).limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(healthAlerts)
          .set({
            enabled: input.enabled ? 1 : 0,
            alertChannelId: input.alertChannelId,
            offlineAlertEnabled: input.offlineAlertEnabled ? 1 : 0,
            errorAlertEnabled: input.errorAlertEnabled ? 1 : 0,
            errorThreshold: input.errorThreshold,
            checkIntervalSeconds: input.checkIntervalSeconds,
          })
          .where(eq(healthAlerts.id, existing[0].id));
      } else {
        // Create new
        await db.insert(healthAlerts).values({
          enabled: input.enabled ? 1 : 0,
          alertChannelId: input.alertChannelId,
          offlineAlertEnabled: input.offlineAlertEnabled ? 1 : 0,
          errorAlertEnabled: input.errorAlertEnabled ? 1 : 0,
          errorThreshold: input.errorThreshold,
          checkIntervalSeconds: input.checkIntervalSeconds,
        });
      }

      // Restart monitoring
      await startHealthMonitoring();

      return {
        success: true,
        message: "Alert configuration updated successfully",
      };
    }),

  // Get alert history
  getHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const history = await db
        .select()
        .from(alertHistory)
        .orderBy(desc(alertHistory.createdAt))
        .limit(input.limit);

      return history;
    }),

  // Test alert (manual trigger)
  testAlert: publicProcedure
    .input(
      z.object({
        alertType: z.enum(["offline", "error", "recovery"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Get config
      const configs = await db
        .select()
        .from(healthAlerts)
        .where(eq(healthAlerts.enabled, 1))
        .limit(1);

      if (configs.length === 0) {
        throw new Error("No active alert configuration found");
      }

      const config = configs[0];

      // Get current health status
      const health = await checkBotHealth();

      // Send test alert
      const discordMessageId = await sendDiscordAlert(
        config.alertChannelId,
        input.alertType,
        `🧪 Test Alert: ${input.alertType.toUpperCase()}`,
        {
          "Test Mode": "This is a test alert",
          "Bot Status": health.isOnline ? "Online" : "Offline",
          Timestamp: new Date().toLocaleString(),
        }
      );

      // Log test alert
      await db.insert(alertHistory).values({
        alertType: input.alertType,
        message: `Test alert: ${input.alertType}`,
        details: JSON.stringify({ test: true, health }),
        discordMessageId: discordMessageId || undefined,
        resolved: input.alertType === "recovery" ? 1 : 0,
        resolvedAt: input.alertType === "recovery" ? new Date() : undefined,
      });

      if (!discordMessageId) {
        throw new Error("Failed to send test alert to Discord");
      }

      return {
        success: true,
        message: "Test alert sent successfully",
        discordMessageId,
      };
    }),

  // Get current bot status
  getBotStatus: publicProcedure.query(async () => {
    const health = await checkBotHealth();
    return health;
  }),
});
