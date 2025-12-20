/**
 * Bot Monitoring Service
 * 
 * Periodically checks bot health and sends alerts when bot goes offline.
 * Also tracks uptime and command metrics for dashboard.
 */

import { getDb } from './db';
import { botMetrics, monitoringAlerts } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Track bot state
let lastBotStatus: boolean | null = null;
let currentSessionStartTime: Date | null = null;
let monitoringInterval: NodeJS.Timeout | null = null;

// Check interval (every 30 seconds)
const CHECK_INTERVAL_MS = 30000;

/**
 * Check if bot is currently online
 */
async function checkBotHealth(): Promise<boolean> {
  try {
    // Check if bot process is running
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync("ps aux | grep 'bot-standalone' | grep -v grep");
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Send alert via Discord webhook
 */
async function sendAlert(
  alertType: string,
  title: string,
  message: string,
  severity: "info" | "warning" | "error" = "error"
) {
  try {
    const db = await getDb();
    if (!db) return;

    // Get alert config
    const config = await db
      .select()
      .from(monitoringAlerts)
      .where(eq(monitoringAlerts.alertType, alertType))
      .limit(1);

    if (config.length === 0 || !config[0].isEnabled || !config[0].webhookUrl) {
      return;
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
        console.log(`[BOT_MONITOR] Alert throttled. Next alert in ${Math.ceil(minMinutes - minutesSinceLastAlert)} minutes`);
        return;
      }
    }

    // Send webhook
    if (!alertConfig.webhookUrl) {
      console.error("[BOT_MONITOR] Webhook URL not configured");
      return;
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
        content: `🚨 **${title}**`,
        embeds: [
          {
            title: title,
            description: message,
            color: colorMap[severity],
            timestamp: new Date().toISOString(),
            footer: {
              text: `Alert Type: ${alertType}`,
            },
          },
        ],
      }),
    });

    if (response.ok) {
      // Update last triggered time
      await db
        .update(monitoringAlerts)
        .set({
          lastTriggered: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(monitoringAlerts.id, alertConfig.id));

      console.log(`[BOT_MONITOR] Alert sent successfully: ${title}`);
    } else {
      console.error(`[BOT_MONITOR] Failed to send alert: ${response.status}`);
    }
  } catch (error) {
    console.error("[BOT_MONITOR] Error sending alert:", error);
  }
}

/**
 * Record uptime metric
 */
async function recordUptimeMetric(seconds: number) {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(botMetrics).values({
      metricType: "uptime",
      metricName: "current_session",
      metricValue: seconds,
      metadata: JSON.stringify({
        sessionStart: currentSessionStartTime?.toISOString(),
      }),
    });
  } catch (error) {
    console.error("[BOT_MONITOR] Error recording uptime metric:", error);
  }
}

/**
 * Main monitoring loop
 */
async function monitorBot() {
  try {
    const isOnline = await checkBotHealth();

    // Check for status change
    if (lastBotStatus !== null && lastBotStatus !== isOnline) {
      if (!isOnline) {
        // Bot went offline
        console.log("[BOT_MONITOR] Bot went offline, sending alert...");
        await sendAlert(
          "bot_offline",
          "Bot Offline",
          "The Discord bot has gone offline. Please check the bot status and restart if necessary.",
          "error"
        );
        currentSessionStartTime = null;
      } else {
        // Bot came back online
        console.log("[BOT_MONITOR] Bot came back online");
        await sendAlert(
          "bot_offline",
          "Bot Online",
          "The Discord bot is now back online and operational.",
          "info"
        );
        currentSessionStartTime = new Date();
      }
    }

    // Track session start
    if (isOnline && currentSessionStartTime === null) {
      currentSessionStartTime = new Date();
    }

    // Record uptime metric if bot is online
    if (isOnline && currentSessionStartTime) {
      const uptimeSeconds = Math.floor(
        (Date.now() - currentSessionStartTime.getTime()) / 1000
      );
      await recordUptimeMetric(uptimeSeconds);
    }

    lastBotStatus = isOnline;
  } catch (error) {
    console.error("[BOT_MONITOR] Error in monitoring loop:", error);
  }
}

/**
 * Start the monitoring service
 */
export function startBotMonitoring() {
  if (monitoringInterval) {
    console.log("[BOT_MONITOR] Monitoring already running");
    return;
  }

  console.log("[BOT_MONITOR] Starting bot monitoring service...");
  
  // Run initial check
  monitorBot();

  // Set up periodic checks
  monitoringInterval = setInterval(monitorBot, CHECK_INTERVAL_MS);

  console.log(`[BOT_MONITOR] Monitoring service started (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
}

/**
 * Stop the monitoring service
 */
export function stopBotMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log("[BOT_MONITOR] Monitoring service stopped");
  }
}

/**
 * Record a command execution metric
 */
export async function recordCommandMetric(commandName: string) {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(botMetrics).values({
      metricType: "command",
      metricName: commandName,
      metricValue: 1,
      metadata: JSON.stringify({
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("[BOT_MONITOR] Error recording command metric:", error);
  }
}

/**
 * Record an error metric
 */
export async function recordErrorMetric(errorType: string, errorMessage?: string) {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(botMetrics).values({
      metricType: "error",
      metricName: errorType,
      metricValue: 1,
      metadata: JSON.stringify({
        message: errorMessage,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("[BOT_MONITOR] Error recording error metric:", error);
  }
}
