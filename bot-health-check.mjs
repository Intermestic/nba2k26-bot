#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STATUS_FILE = path.join(__dirname, 'bot-status.json');
const CHECK_INTERVAL = 30000; // Check every 30 seconds
const OFFLINE_THRESHOLD = 120000; // 2 minutes offline = restart
const ERROR_THRESHOLD = 10; // 10 consecutive errors = restart

let consecutiveErrors = 0;
let lastOnlineTime = Date.now();

async function checkBotHealth() {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      console.log('[Health Check] Status file not found, bot may be starting up');
      return;
    }

    const statusContent = fs.readFileSync(STATUS_FILE, 'utf-8');
    const status = JSON.parse(statusContent);
    
    const isOnline = status.isOnline === true;
    const lastUpdate = new Date(status.lastUpdate).getTime();
    const timeSinceUpdate = Date.now() - lastUpdate;
    
    if (isOnline) {
      consecutiveErrors = 0;
      lastOnlineTime = Date.now();
      console.log(`[Health Check] ✅ Bot is online (last update: ${Math.round(timeSinceUpdate / 1000)}s ago)`);
      return;
    }

    // Bot is offline
    const timeSinceOnline = Date.now() - lastOnlineTime;
    console.warn(`[Health Check] ⚠️  Bot is offline (${Math.round(timeSinceOnline / 1000)}s since last online)`);
    
    consecutiveErrors++;
    
    if (consecutiveErrors >= ERROR_THRESHOLD || timeSinceOnline > OFFLINE_THRESHOLD) {
      console.error(`[Health Check] 🔴 Bot offline for too long or too many errors (${consecutiveErrors}/${ERROR_THRESHOLD}). Restarting...`);
      try {
        await execAsync('pm2 restart nba2k26-bot');
        console.log('[Health Check] Bot restart initiated');
        consecutiveErrors = 0;
      } catch (error) {
        console.error('[Health Check] Failed to restart bot:', error.message);
      }
    }
  } catch (error) {
    console.error('[Health Check] Error checking bot health:', error.message);
    consecutiveErrors++;
    
    if (consecutiveErrors >= ERROR_THRESHOLD) {
      console.error('[Health Check] Too many check errors, attempting restart');
      try {
        await execAsync('pm2 restart nba2k26-bot');
        consecutiveErrors = 0;
      } catch (restartError) {
        console.error('[Health Check] Failed to restart:', restartError.message);
      }
    }
  }
}

// Start health checks
console.log('[Health Check] Starting bot health monitor (check every 30s)');
setInterval(checkBotHealth, CHECK_INTERVAL);

// Initial check
checkBotHealth();
