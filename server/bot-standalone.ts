/**
 * Standalone Discord Bot Process
 * 
 * This file runs the Discord bot in a completely separate process from the web server.
 * This prevents HMR (Hot Module Reload) from creating duplicate bot instances.
 */

import { startDiscordBot, stopDiscordBot } from "./discord-bot.js";

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
  
  async function handleCrash(error: any, source: string) {
    console.error(`[Bot Standalone] ${source}:`, error);
    
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
    await stopDiscordBot();
    
    // Wait before restarting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      console.log('[Bot Standalone] Restarting bot after crash...');
      await startDiscordBot(process.env.DISCORD_BOT_TOKEN!);
      console.log('[Bot Standalone] Bot restarted successfully after crash');
      crashCount = 0; // Reset on successful restart
    } catch (restartError) {
      console.error('[Bot Standalone] Failed to restart after crash:', restartError);
      process.exit(1);
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
