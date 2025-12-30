import { getDb } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface BotHealthStatus {
  status: 'healthy' | 'degraded' | 'offline';
  uptime: number;
  lastLockRefresh: string | null;
  lockOwner: string | null;
  lockExpiry: string | null;
  instanceId: string;
  memoryUsage: number;
  processUptime: number;
  errors: string[];
}

const STATUS_FILE = '/home/ubuntu/nba2k26-database/bot-status.json';

/**
 * Get current bot health status
 */
export async function getBotHealthStatus(): Promise<BotHealthStatus> {
  const errors: string[] = [];
  let status: 'healthy' | 'degraded' | 'offline' = 'offline';
  let lockOwner: string | null = null;
  let lockExpiry: string | null = null;
  let lastLockRefresh: string | null = null;

  try {
    // Check if bot process is running
    const statusFileExists = fs.existsSync(STATUS_FILE);
    if (!statusFileExists) {
      errors.push('Bot status file not found');
      return {
        status: 'offline',
        uptime: 0,
        lastLockRefresh: null,
        lockOwner: null,
        lockExpiry: null,
        instanceId: 'unknown',
        memoryUsage: 0,
        processUptime: 0,
        errors
      };
    }

    // Read status file
    const statusData = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    if (!statusData.online) {
      errors.push(`Bot status is ${statusData.status}`);
      return {
        status: 'offline',
        uptime: 0,
        lastLockRefresh: null,
        lockOwner: null,
        lockExpiry: null,
        instanceId: 'unknown',
        memoryUsage: 0,
        processUptime: 0,
        errors
      };
    }

    // Check database lock
    const db = await getDb();
    if (!db) {
      errors.push('Database connection unavailable');
      status = 'degraded';
    } else {
      try {
        const lockResult = await db.execute(sql`
          SELECT instanceId, expiresAt, lockedAt 
          FROM bot_instance_lock 
          WHERE id = 1
        `);
        
        const rows = (lockResult as any).rows || [];
        if (rows.length > 0) {
          lockOwner = rows[0].instanceId;
          lockExpiry = new Date(rows[0].expiresAt).toISOString();
          lastLockRefresh = new Date(rows[0].lockedAt).toISOString();

          // Check if lock is about to expire (within 30 seconds)
          const expiryTime = new Date(rows[0].expiresAt).getTime();
          const now = Date.now();
          if (expiryTime - now < 30000) {
            errors.push(`Lock expiring soon (${Math.round((expiryTime - now) / 1000)}s)`);
            status = 'degraded';
          } else if (lockOwner === statusData.instanceId) {
            status = 'healthy';
          } else {
            errors.push(`Lock owned by different instance: ${lockOwner}`);
            status = 'degraded';
          }
        } else {
          errors.push('No lock record found in database');
          status = 'degraded';
        }
      } catch (dbError) {
        errors.push(`Database query failed: ${(dbError as any)?.message || 'unknown error'}`);
        status = 'degraded';
      }
    }

    return {
      status,
      uptime: statusData.uptime || 0,
      lastLockRefresh,
      lockOwner,
      lockExpiry,
      instanceId: statusData.instanceId || 'unknown',
      memoryUsage: process.memoryUsage().heapUsed,
      processUptime: statusData.uptime || 0,
      errors
    };
  } catch (error) {
    errors.push(`Health check failed: ${(error as any)?.message || 'unknown error'}`);
    return {
      status: 'offline',
      uptime: 0,
      lastLockRefresh: null,
      lockOwner: null,
      lockExpiry: null,
      instanceId: 'unknown',
      memoryUsage: 0,
      processUptime: 0,
      errors
    };
  }
}

/**
 * Check if bot is healthy and alert if degraded
 */
export async function checkBotHealth(): Promise<void> {
  const health = await getBotHealthStatus();
  
  if (health.status === 'offline') {
    console.error('[Bot Health Monitor] ⚠️ Bot is OFFLINE - immediate restart required');
  } else if (health.status === 'degraded') {
    console.warn('[Bot Health Monitor] ⚠️ Bot is DEGRADED - issues detected:');
    health.errors.forEach(err => console.warn(`  - ${err}`));
  } else {
    console.log('[Bot Health Monitor] ✅ Bot is HEALTHY');
  }
}

/**
 * Start periodic health checks
 */
export function startHealthMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`[Bot Health Monitor] Starting health checks every ${intervalMs}ms`);
  
  return setInterval(async () => {
    try {
      await checkBotHealth();
    } catch (error) {
      console.error('[Bot Health Monitor] Health check error:', error);
    }
  }, intervalMs);
}
