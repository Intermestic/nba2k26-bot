/**
 * Standalone Discord Bot Process
 * 
 * This file runs the Discord bot in a completely separate process from the web server.
 * This prevents HMR (Hot Module Reload) from creating duplicate bot instances.
 */

import { startDiscordBot, stopDiscordBot, getDiscordClient } from "./discord-bot";
import express from 'express';
import { getDb } from "./db";
import { tradeLogs } from "../drizzle/schema";

const TRADE_CHANNEL_ID = "1336156955722645535";

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
  } catch (error) {
    console.error('[Bot Standalone] Failed to start Discord bot:', error);
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
      botUsername: client?.user?.tag || null
    });
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
  process.on('SIGINT', async () => {
    console.log('[Bot Standalone] Received SIGINT, shutting down...');
    await stopDiscordBot();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[Bot Standalone] Received SIGTERM, shutting down...');
    await stopDiscordBot();
    process.exit(0);
  });
  
  // Track restart attempts to prevent infinite restart loops
  let crashCount = 0;
  const maxCrashes = 5;
  const crashResetInterval = 5 * 60 * 1000; // Reset crash count after 5 minutes
  let lastCrashTime = 0;
  let isRestarting = false; // Prevent concurrent restart attempts
  
  async function handleCrash(error: any, source: string) {
    console.error(`[Bot Standalone] ${source}:`, error);
    
    // Prevent concurrent restart attempts
    if (isRestarting) {
      console.log('[Bot Standalone] Restart already in progress, ignoring crash');
      return;
    }
    
    isRestarting = true;
    
    const now = Date.now();
    if (now - lastCrashTime > crashResetInterval) {
      crashCount = 0; // Reset if it's been a while since last crash
    }
    lastCrashTime = now;
    crashCount++;
    
    if (crashCount >= maxCrashes) {
      console.error(`[Bot Standalone] Too many crashes (${crashCount}), giving up`);
      await stopDiscordBot();
      process.exit(1);
    }
    
    console.log(`[Bot Standalone] Crash ${crashCount}/${maxCrashes}, attempting restart in 5 seconds...`);
    
    try {
      await stopDiscordBot();
    } catch (stopError) {
      console.error('[Bot Standalone] Error stopping bot:', stopError);
    }
    
    // Wait before restarting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      console.log('[Bot Standalone] Restarting bot after crash...');
      await startDiscordBot(process.env.DISCORD_BOT_TOKEN!);
      console.log('[Bot Standalone] Bot restarted successfully after crash');
      crashCount = 0; // Reset on successful restart
      isRestarting = false;
    } catch (restartError) {
      console.error('[Bot Standalone] Failed to restart after crash:', restartError);
      isRestarting = false;
      // Don't exit immediately, let PM2 handle the restart
      setTimeout(() => process.exit(1), 1000);
    }
  }
  
  process.on('uncaughtException', async (error) => {
    await handleCrash(error, 'Uncaught exception');
  });
  
  process.on('unhandledRejection', async (reason, promise) => {
    await handleCrash(reason, 'Unhandled rejection');
  });
}

main().catch(async (error) => {
  console.error('[Bot Standalone] Fatal error:', error);
  await stopDiscordBot();
  process.exit(1);
});
