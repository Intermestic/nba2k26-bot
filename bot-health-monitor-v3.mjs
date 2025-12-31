#!/usr/bin/env node
/**
 * Discord Bot Health Monitor v3 - Simplified
 * 
 * Monitors bot status and restarts if needed
 * Uses simple file-based status checking
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATUS_FILE = path.join(__dirname, 'bot-status.json');
const LOCK_FILE = path.join(__dirname, 'bot.lock');

// Configuration
const CHECK_INTERVAL = 30000; // Check every 30 seconds
const HEARTBEAT_TIMEOUT = 120000; // 2 minutes without update = offline
const RESTART_COOLDOWN = 60000; // Wait 60s between restarts

// State
let consecutiveFailures = 0;
let lastRestartTime = 0;
let restartCount = 0;

function log(level, message) {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '🔴' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `[${timestamp}] ${prefix} ${message}`
  );
}

async function checkBotHealth() {
  try {
    // Check if status file exists
    if (!fs.existsSync(STATUS_FILE)) {
      consecutiveFailures++;
      log('warn', `Status file missing (${consecutiveFailures} failures)`);
      
      if (consecutiveFailures >= 3) {
        await restartBot('Status file missing');
      }
      return;
    }

    // Read status file
    const statusContent = fs.readFileSync(STATUS_FILE, 'utf-8');
    const status = JSON.parse(statusContent);

    // Check file age (heartbeat)
    const stats = fs.statSync(STATUS_FILE);
    const ageMs = Date.now() - stats.mtimeMs;

    if (ageMs > HEARTBEAT_TIMEOUT) {
      log('error', `Status file stale (${Math.round(ageMs / 1000)}s old)`);
      await restartBot(`Heartbeat timeout (${Math.round(ageMs / 1000)}s)`);
      return;
    }

    // Check online status
    if (status.online === true) {
      if (consecutiveFailures > 0) {
        log('success', `Bot recovered! (was offline for ${consecutiveFailures} checks)`);
      }
      consecutiveFailures = 0;
      const username = status.username || 'Unknown';
      log('info', `Bot online as ${username} (status age: ${Math.round(ageMs / 1000)}s)`);
      return;
    }

    // Bot is offline
    consecutiveFailures++;
    log('warn', `Bot offline (${consecutiveFailures} failures, status age: ${Math.round(ageMs / 1000)}s)`);

    if (consecutiveFailures >= 3) {
      await restartBot(`Offline for ${consecutiveFailures} checks`);
    }
  } catch (error) {
    consecutiveFailures++;
    log('error', `Health check error (${consecutiveFailures} failures): ${error.message}`);

    if (consecutiveFailures >= 3) {
      await restartBot(`${consecutiveFailures} consecutive errors`);
    }
  }
}

async function restartBot(reason) {
  const now = Date.now();
  const timeSinceLastRestart = now - lastRestartTime;

  // Enforce cooldown
  if (timeSinceLastRestart < RESTART_COOLDOWN) {
    const remaining = Math.round((RESTART_COOLDOWN - timeSinceLastRestart) / 1000);
    log('warn', `Restart cooldown active (${remaining}s remaining)`);
    return;
  }

  restartCount++;
  log('error', `Restarting bot (attempt #${restartCount}): ${reason}`);

  try {
    // Clear lock file to allow fresh start
    if (fs.existsSync(LOCK_FILE)) {
      try {
        fs.unlinkSync(LOCK_FILE);
        log('info', 'Cleared lock file');
      } catch (e) {
        log('warn', 'Could not clear lock file');
      }
    }

    // Start new bot process in background
    // Using exec to spawn in background without waiting
    exec('node start-bot.mjs > /tmp/bot.log 2>&1 &', (error) => {
      if (error) {
        log('error', `Failed to start bot: ${error.message}`);
      }
    });
    
    lastRestartTime = Date.now();
    consecutiveFailures = 0;
    log('success', 'Bot restart initiated');
  } catch (error) {
    log('error', `Failed to restart bot: ${error.message}`);
  }
}

// Startup
log('info', '='.repeat(60));
log('info', 'Discord Bot Health Monitor v3 Starting');
log('info', `Check interval: ${CHECK_INTERVAL / 1000}s`);
log('info', `Heartbeat timeout: ${HEARTBEAT_TIMEOUT / 1000}s`);
log('info', `Restart cooldown: ${RESTART_COOLDOWN / 1000}s`);
log('info', '='.repeat(60));

// Initial check
checkBotHealth();

// Periodic checks
setInterval(checkBotHealth, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Health monitor shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Health monitor shutting down');
  process.exit(0);
});
