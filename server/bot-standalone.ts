/**
 * Standalone Discord Bot Process
 * 
 * This file runs the Discord bot in a completely separate process from the web server.
 * This prevents HMR (Hot Module Reload) from creating duplicate bot instances.
 * 
 * Supports systemd watchdog for automatic restart on hang.
 */

import { startDiscordBot, stopDiscordBot, getDiscordClient } from "./discord-bot";
import express from 'express';
import { getDb } from "./db";
import { tradeLogs } from "../drizzle/schema";
import { getBotHealthStatus } from "./bot-health-monitor";
import fs from 'fs';

const TRADE_CHANNEL_ID = "1336156955722645535";

// Systemd watchdog support
const WATCHDOG_USEC = process.env.WATCHDOG_USEC;
let watchdogInterval: NodeJS.Timeout | null = null;

/**
 * Notify systemd that the service is ready/alive
 * Uses sd_notify protocol via NOTIFY_SOCKET
 */
function notifySystemd(state: string) {
  const notifySocket = process.env.NOTIFY_SOCKET;
  if (!notifySocket) return;

  try {
    const dgram = require('dgram');
    const client = dgram.createSocket('unix_dgram');
    const message = Buffer.from(state);
    
    client.send(message, notifySocket, (err: any) => {
      client.close();
      if (err) {
        console.error('[Bot Standalone] Failed to notify systemd:', err.message);
      }
    });
  } catch (error) {
    // Silently fail if dgram not available or socket issues
  }
}

/**
 * Start systemd watchdog heartbeat
 * Sends WATCHDOG=1 at half the watchdog interval
 */
function startWatchdogHeartbeat() {
  if (!WATCHDOG_USEC) {
    console.log('[Bot Standalone] Systemd watchdog not configured, skipping heartbeat');
    return;
  }

  const watchdogMs = parseInt(WATCHDOG_USEC) / 1000; // Convert microseconds to milliseconds
  const heartbeatMs = watchdogMs / 2; // Send heartbeat at half the interval

  console.log(`[Bot Standalone] Starting systemd watchdog heartbeat every ${heartbeatMs}ms`);

  watchdogInterval = setInterval(() => {
    const client = getDiscordClient();
    
    // Only send heartbeat if bot is actually healthy
    if (client && client.isReady()) {
      notifySystemd('WATCHDOG=1');
    } else {
      console.warn('[Bot Standalone] Bot not ready, skipping watchdog heartbeat');
      // If bot is not ready for too long, systemd will restart us
    }
  }, heartbeatMs);
}

/**
 * Stop watchdog heartbeat
 */
function stopWatchdogHeartbeat() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

async function main() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  
  if (!botToken) {
    console.error('[Bot Standalone] DISCORD_BOT_TOKEN not provided');
    process.exit(1);
  }

  try {
    console.log('[Bot Standalone] Starting Discord bot in standalone process...');
    await startDiscordBot(botToken);
    console.log('[Bot Standalone] Discord bot started successfully');
    
    // Notify systemd that we're ready
    notifySystemd('READY=1');
    
    // Start watchdog heartbeat
    startWatchdogHeartbeat();
  } catch (error) {
    console.error('[Bot Standalone] Failed to start Discord bot:', error);
    notifySystemd('STATUS=Failed to start');
    process.exit(1);
  }

  // Start HTTP server for bot commands
  const app = express();
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    const client = getDiscordClient();
    res.json({
      status: 'ok',
      botReady: client?.isReady() || false,
      botUsername: client?.user?.tag || null,
      systemdWatchdog: !!WATCHDOG_USEC
    });
  });
  
  // Enhanced health status endpoint
  app.get('/health/detailed', async (req, res) => {
    try {
      const health = await getBotHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        ...health,
        systemdWatchdog: !!WATCHDOG_USEC
      });
    } catch (error) {
      res.status(500).json({
        status: 'offline',
        error: (error as any)?.message || 'Unknown error',
        systemdWatchdog: !!WATCHDOG_USEC
      });
    }
  });
  
  // Post trade to Discord endpoint
  app.post('/post-trade', async (req, res) => {
    try {
      const { team1Name, team1Players, team2Name, team2Players } = req.body;
      
      const client = getDiscordClient();
      if (!client || !client.isReady()) {
        return res.status(503).json({ error: 'Discord bot is not connected' });
      }
      
      // Calculate totals
      const team1TotalOvr = team1Players.reduce((sum: number, p: any) => sum + p.overall, 0);
      const team1TotalBadges = team1Players.reduce((sum: number, p: any) => sum + p.badges, 0);
      const team2TotalOvr = team2Players.reduce((sum: number, p: any) => sum + p.overall, 0);
      const team2TotalBadges = team2Players.reduce((sum: number, p: any) => sum + p.badges, 0);
      
      // Format trade message
      const lines: string[] = [];
      
      lines.push(`**${team1Name} Sends:**`);
      lines.push('');
      team1Players.forEach((player: any) => {
        lines.push(`${player.name} ${player.overall} (${player.badges})`);
      });
      lines.push('--');
      lines.push(`${team1TotalOvr} (${team1TotalBadges})`);
      lines.push('');
      
      lines.push(`**${team2Name} Sends:**`);
      lines.push('');
      team2Players.forEach((player: any) => {
        lines.push(`${player.name} ${player.overall} (${player.badges})`);
      });
      lines.push('--');
      lines.push(`${team2TotalOvr} (${team2TotalBadges})`);
      
      const message = lines.join('\n');
      
      // Post to Discord channel
      const channel = await client.channels.fetch(TRADE_CHANNEL_ID);
      
      if (!channel || !channel.isTextBased()) {
        return res.status(400).json({ error: 'Trade channel not found or not a text channel' });
      }
      
      if (!('send' in channel)) {
        return res.status(400).json({ error: 'Channel does not support sending messages' });
      }
      
      await channel.send(message);
      
      console.log(`[Bot Standalone] Posted trade to Discord: ${team1Name} ↔ ${team2Name}`);
      
      // Save trade to database for admin review (non-blocking, don't fail if DB is down)
      try {
        const db = await getDb();
        if (db) {
          const playerBadgesMap: Record<string, number> = {};
          team1Players.forEach((p: any) => {
            playerBadgesMap[p.name] = p.badges;
          });
          team2Players.forEach((p: any) => {
            playerBadgesMap[p.name] = p.badges;
          });
          
          await db.insert(tradeLogs).values({
            team1: team1Name,
            team2: team2Name,
            team1Players: JSON.stringify(team1Players),
            team2Players: JSON.stringify(team2Players),
            playerBadges: JSON.stringify(playerBadgesMap),
            status: "pending",
            submittedBy: "Trade Machine",
          });
          
          console.log(`[Bot Standalone] Saved trade to database for review`);
        }
      } catch (dbError) {
        console.error(`[Bot Standalone] Failed to save trade to database (non-critical):`, dbError);
        // Don't fail the request - Discord post was successful
      }
      
      res.json({ success: true, message: 'Trade posted to Discord successfully' });
    } catch (error) {
      console.error('[Bot Standalone] Error posting trade:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  const BOT_HTTP_PORT = process.env.BOT_HTTP_PORT || 3001;
  app.listen(BOT_HTTP_PORT, () => {
    console.log(`[Bot Standalone] HTTP server listening on port ${BOT_HTTP_PORT}`);
  });

  // Keep process alive
  let isShuttingDown = false;
  
  async function gracefulShutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`[Bot Standalone] Received ${signal}, shutting down...`);
    notifySystemd('STOPPING=1');
    
    stopWatchdogHeartbeat();
    await stopDiscordBot();
    process.exit(0);
  }
  
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Handle critical bot failures that require immediate exit
  process.on('botCriticalFailure', async (error: any) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.error('[Bot Standalone] Critical bot failure detected:', error);
    notifySystemd('STATUS=Critical failure');
    stopWatchdogHeartbeat();
    await stopDiscordBot();
    // Exit with code 1 so systemd will restart
    process.exit(1);
  });
  
  process.on('uncaughtException', async (error) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.error('[Bot Standalone] Uncaught exception:', error);
    notifySystemd('STATUS=Uncaught exception');
    stopWatchdogHeartbeat();
    await stopDiscordBot();
    process.exit(1);
  });
  
  process.on('unhandledRejection', async (reason, promise) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.error('[Bot Standalone] Unhandled rejection:', reason);
    notifySystemd('STATUS=Unhandled rejection');
    stopWatchdogHeartbeat();
    await stopDiscordBot();
    process.exit(1);
  });
}

main().catch(async (error) => {
  console.error('[Bot Standalone] Fatal error:', error);
  notifySystemd('STATUS=Fatal error');
  await stopDiscordBot();
  process.exit(1);
});
