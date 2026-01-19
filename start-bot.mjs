#!/usr/bin/env node
/**
 * Bot Startup Script
 * 
 * Simple entry point to start the Discord bot.
 * Run with: node start-bot.mjs
 */

import { startBot } from './bot/index.ts';

console.log('========================================');
console.log('  NBA 2K26 Discord Bot - Clean Rebuild');
console.log('========================================');
console.log('');

startBot()
  .then(() => {
    console.log('Bot started successfully!');
  })
  .catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
  });
