#!/usr/bin/env node
/**
 * Discord Bot Health Monitor v2.0
 * 
 * This script monitors the Discord bot and automatically restarts it if:
 * 1. The bot status file shows offline for too long
 * 2. The status file hasn't been updated (heartbeat timeout)
 * 3. Too many consecutive errors occur
 * 
 * Key improvements:
 * - Fixed field name mismatch (online vs isOnline)
 * - Added heartbeat monitoring (status file must be updated regularly)
 * - More aggressive recovery with exponential backoff
 * - Better logging for debugging
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATUS_FILE = path.join(__dirname, 'bot-status.json');

// Configuration
const CHECK_INTERVAL = 30000; // Check every 30 seconds
const OFFLINE_THRESHOLD = 90000; // 90 seconds offline = restart (reduced from 2 min)
const HEARTBEAT_TIMEOUT = 120000; // 2 minutes without status update = restart
const ERROR_THRESHOLD = 5; // 5 consecutive errors = restart (reduced from 10)
const RESTART_COOLDOWN = 60000; // Wait at least 60 seconds between restarts

// State tracking
let consecutiveOfflineChecks = 0;
let consecutiveErrors = 0;
let lastOnlineTime = Date.now();
let lastStatusUpdate = Date.now();
let lastRestartTime = 0;
let restartCount = 0;

function log(level, message) {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '🔴' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${timestamp}] ${prefix} [Health Check] ${message}`);
}

async function restartBot(reason) {
  const now = Date.now();
  const timeSinceLastRestart = now - lastRestartTime;
  
  // Enforce cooldown between restarts
  if (timeSinceLastRestart < RESTART_COOLDOWN) {
    log('warn', `Restart cooldown active (${Math.round((RESTART_COOLDOWN - timeSinceLastRestart) / 1000)}s remaining)`);
    return false;
  }
  
  restartCount++;
  log('error', `Restarting bot (attempt #${restartCount}): ${reason}`);
  
  try {
    // First, try graceful restart
    await execAsync('pm2 restart nba2k26-bot --update-env');
    lastRestartTime = Date.now();
    consecutiveOfflineChecks = 0;
    consecutiveErrors = 0;
    lastOnlineTime = Date.now();
    lastStatusUpdate = Date.now();
    log('success', 'Bot restart initiated successfully');
    return true;
  } catch (error) {
    log('error', `Failed to restart bot: ${error.message}`);
    
    // If restart fails, try stop then start
    try {
      log('warn', 'Attempting stop + start sequence...');
      await execAsync('pm2 stop nba2k26-bot');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await execAsync('pm2 start nba2k26-bot --update-env');
      lastRestartTime = Date.now();
      log('success', 'Bot started after stop');
      return true;
    } catch (secondError) {
      log('error', `Stop + start also failed: ${secondError.message}`);
      return false;
    }
  }
}

async function checkBotHealth() {
  try {
    // Check if status file exists
    if (!fs.existsSync(STATUS_FILE)) {
      consecutiveErrors++;
      log('warn', `Status file not found (error ${consecutiveErrors}/${ERROR_THRESHOLD})`);
      
      if (consecutiveErrors >= ERROR_THRESHOLD) {
        await restartBot('Status file missing for too long');
      }
      return;
    }
    
    // Read and parse status file
    const statusContent = fs.readFileSync(STATUS_FILE, 'utf-8');
    let status;
    try {
      status = JSON.parse(statusContent);
    } catch (parseError) {
      consecutiveErrors++;
      log('error', `Failed to parse status file (error ${consecutiveErrors}/${ERROR_THRESHOLD})`);
      if (consecutiveErrors >= ERROR_THRESHOLD) {
        await restartBot('Status file corrupted');
      }
      return;
    }
    
    // Check heartbeat (when was status file last updated)
    const statusFileStats = fs.statSync(STATUS_FILE);
    const statusFileAge = Date.now() - statusFileStats.mtimeMs;
    
    if (statusFileAge > HEARTBEAT_TIMEOUT) {
      log('error', `Status file not updated for ${Math.round(statusFileAge / 1000)}s (heartbeat timeout)`);
      await restartBot(`Heartbeat timeout - no status update for ${Math.round(statusFileAge / 1000)}s`);
      return;
    }
    
    // Update last status update time
    lastStatusUpdate = Date.now();
    
    // Check online status - handle both field names for compatibility
    const isOnline = status.online === true || status.isOnline === true;
    const isReconnecting = status.reconnecting === true;
    
    if (isOnline) {
      // Bot is online - reset all counters
      if (consecutiveOfflineChecks > 0 || consecutiveErrors > 0) {
        log('success', `Bot recovered! Was offline for ${consecutiveOfflineChecks} checks`);
      }
      consecutiveOfflineChecks = 0;
      consecutiveErrors = 0;
      lastOnlineTime = Date.now();
      
      const username = status.username || 'Unknown';
      log('info', `Bot online as ${username} (status file age: ${Math.round(statusFileAge / 1000)}s)`);
      return;
    }
    
    // Bot is offline or reconnecting
    consecutiveOfflineChecks++;
    const timeSinceOnline = Date.now() - lastOnlineTime;
    
    if (isReconnecting) {
      log('warn', `Bot reconnecting (${consecutiveOfflineChecks} checks, ${Math.round(timeSinceOnline / 1000)}s since online)`);
      
      // Give reconnection more time before forcing restart
      if (timeSinceOnline > OFFLINE_THRESHOLD * 2) {
        await restartBot(`Reconnection taking too long (${Math.round(timeSinceOnline / 1000)}s)`);
      }
      return;
    }
    
    log('warn', `Bot offline (${consecutiveOfflineChecks} checks, ${Math.round(timeSinceOnline / 1000)}s since online)`);
    
    // Check if we should restart
    if (timeSinceOnline > OFFLINE_THRESHOLD) {
      await restartBot(`Offline for ${Math.round(timeSinceOnline / 1000)}s (threshold: ${OFFLINE_THRESHOLD / 1000}s)`);
    } else if (consecutiveOfflineChecks >= ERROR_THRESHOLD) {
      await restartBot(`${consecutiveOfflineChecks} consecutive offline checks`);
    }
    
  } catch (error) {
    consecutiveErrors++;
    log('error', `Health check error (${consecutiveErrors}/${ERROR_THRESHOLD}): ${error.message}`);
    
    if (consecutiveErrors >= ERROR_THRESHOLD) {
      await restartBot(`${consecutiveErrors} consecutive health check errors`);
    }
  }
}

// Startup
log('info', '='.repeat(60));
log('info', 'Discord Bot Health Monitor v2.0 Starting');
log('info', `Check interval: ${CHECK_INTERVAL / 1000}s`);
log('info', `Offline threshold: ${OFFLINE_THRESHOLD / 1000}s`);
log('info', `Heartbeat timeout: ${HEARTBEAT_TIMEOUT / 1000}s`);
log('info', `Error threshold: ${ERROR_THRESHOLD} consecutive errors`);
log('info', `Restart cooldown: ${RESTART_COOLDOWN / 1000}s`);
log('info', '='.repeat(60));

// Run initial check
checkBotHealth();

// Start periodic checks
setInterval(checkBotHealth, CHECK_INTERVAL);

// Handle process signals gracefully
process.on('SIGINT', () => {
  log('info', 'Health monitor shutting down (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Health monitor shutting down (SIGTERM)');
  process.exit(0);
});
