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
  
  process.on('uncaughtException', async (error) => {
    console.error('[Bot Standalone] Uncaught exception:', error);
    await stopDiscordBot();
    process.exit(1);
  });
  
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('[Bot Standalone] Unhandled rejection at:', promise, 'reason:', reason);
    await stopDiscordBot();
    process.exit(1);
  });
}

main().catch(async (error) => {
  console.error('[Bot Standalone] Fatal error:', error);
  await stopDiscordBot();
  process.exit(1);
});
