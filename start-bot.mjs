#!/usr/bin/env node
/**
 * Simple Discord Bot Startup Script
 * 
 * This script:
 * 1. Clears any stale locks
 * 2. Starts the Discord bot
 * 3. Maintains the status file for health monitoring
 * 4. Handles graceful shutdown
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(__dirname, 'bot.lock');
const STATUS_FILE = path.join(__dirname, 'bot-status.json');

// Get Discord token from environment
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

console.log('🤖 Discord Bot Startup Script');
console.log('================================');

// Clear stale lock if it exists
if (fs.existsSync(LOCK_FILE)) {
  try {
    const lockContent = fs.readFileSync(LOCK_FILE, 'utf-8');
    const lock = JSON.parse(lockContent);
    const ageMs = Date.now() - lock.acquiredAt;
    
    if (ageMs > 120000) { // 2 minutes
      console.log(`🔓 Removing stale lock (age: ${Math.round(ageMs / 1000)}s)`);
      fs.unlinkSync(LOCK_FILE);
    } else {
      console.log(`⚠️  Lock file exists and is fresh (age: ${Math.round(ageMs / 1000)}s)`);
      console.log(`    Another bot instance may be running. Exiting.`);
      process.exit(1);
    }
  } catch (error) {
    console.warn(`⚠️  Error reading lock file, removing it:`, error.message);
    try {
      fs.unlinkSync(LOCK_FILE);
    } catch (e) {
      // Ignore
    }
  }
}

// Clear stale status file
if (fs.existsSync(STATUS_FILE)) {
  try {
    fs.unlinkSync(STATUS_FILE);
    console.log('🧹 Cleared old status file');
  } catch (error) {
    console.warn('⚠️  Could not clear status file:', error.message);
  }
}

console.log('🚀 Starting bot process...\n');

// Start the bot using tsx to run TypeScript directly
const botProcess = spawn('node', [
  '--loader', 'tsx',
  '--no-warnings',
  'server/_core/index.ts'
], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    DISCORD_BOT_TOKEN,
  }
});

// Handle process exit
botProcess.on('exit', (code, signal) => {
  console.log(`\n⛔ Bot process exited with code ${code} and signal ${signal}`);
  
  // Clean up lock file on exit
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log('🔓 Lock file cleaned up');
    }
  } catch (error) {
    console.error('Error cleaning up lock file:', error);
  }
  
  process.exit(code || 0);
});

// Handle signals
process.on('SIGINT', () => {
  console.log('\n📛 Received SIGINT, shutting down gracefully...');
  botProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n📛 Received SIGTERM, shutting down gracefully...');
  botProcess.kill('SIGTERM');
});

console.log('✅ Bot startup script initialized');
