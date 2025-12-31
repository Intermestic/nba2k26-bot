/**
 * Simple file-based lock manager for Discord bot singleton pattern
 * Replaces complex database locking with a straightforward approach
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(__dirname, '..', 'bot.lock');
const LOCK_TIMEOUT = 30000; // 30 seconds - if lock file is older, it's considered stale

export interface BotLock {
  instanceId: string;
  pid: number;
  acquiredAt: number;
}

/**
 * Try to acquire the bot lock
 * Returns true if lock was acquired, false if already held by another instance
 */
export async function acquireLock(instanceId: string): Promise<boolean> {
  try {
    // Check if lock file exists and is still valid
    if (fs.existsSync(LOCK_FILE)) {
      try {
        const content = fs.readFileSync(LOCK_FILE, 'utf-8');
        const lock: BotLock = JSON.parse(content);
        const ageMs = Date.now() - lock.acquiredAt;

        // If lock is still fresh, we can't acquire it
        if (ageMs < LOCK_TIMEOUT) {
          console.log(
            `[Bot Lock] Lock held by instance ${lock.instanceId} (PID ${lock.pid}), age: ${Math.round(ageMs / 1000)}s`
          );
          return false;
        }

        // Lock is stale, remove it
        console.log(`[Bot Lock] Removing stale lock (age: ${Math.round(ageMs / 1000)}s)`);
        fs.unlinkSync(LOCK_FILE);
      } catch (error) {
        console.warn(`[Bot Lock] Error reading lock file, removing it:`, error);
        try {
          fs.unlinkSync(LOCK_FILE);
        } catch (e) {
          // Ignore if already deleted
        }
      }
    }

    // Write new lock file
    const lock: BotLock = {
      instanceId,
      pid: process.pid,
      acquiredAt: Date.now(),
    };

    fs.writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2));
    console.log(`[Bot Lock] Lock acquired by instance ${instanceId} (PID ${process.pid})`);
    return true;
  } catch (error) {
    console.error(`[Bot Lock] Error acquiring lock:`, error);
    return false;
  }
}

/**
 * Refresh the lock to keep it valid
 * Should be called periodically while bot is running
 */
export async function refreshLock(instanceId: string): Promise<boolean> {
  try {
    if (!fs.existsSync(LOCK_FILE)) {
      console.warn(`[Bot Lock] Lock file missing, attempting to recreate`);
      return await acquireLock(instanceId);
    }

    const content = fs.readFileSync(LOCK_FILE, 'utf-8');
    const lock: BotLock = JSON.parse(content);

    // Verify we still own the lock
    if (lock.instanceId !== instanceId) {
      console.error(
        `[Bot Lock] Lock ownership mismatch! Our instance: ${instanceId}, lock owner: ${lock.instanceId}`
      );
      return false;
    }

    // Update the timestamp
    lock.acquiredAt = Date.now();
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2));
    return true;
  } catch (error) {
    console.error(`[Bot Lock] Error refreshing lock:`, error);
    return false;
  }
}

/**
 * Release the lock when bot is shutting down
 */
export async function releaseLock(instanceId: string): Promise<void> {
  try {
    if (!fs.existsSync(LOCK_FILE)) {
      return;
    }

    const content = fs.readFileSync(LOCK_FILE, 'utf-8');
    const lock: BotLock = JSON.parse(content);

    // Only delete if we own it
    if (lock.instanceId === instanceId) {
      fs.unlinkSync(LOCK_FILE);
      console.log(`[Bot Lock] Lock released by instance ${instanceId}`);
    } else {
      console.warn(
        `[Bot Lock] Attempted to release lock owned by ${lock.instanceId}, ignoring`
      );
    }
  } catch (error) {
    console.error(`[Bot Lock] Error releasing lock:`, error);
  }
}

/**
 * Force clear the lock (use with caution, only for debugging/recovery)
 */
export async function forceClearLock(): Promise<void> {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log(`[Bot Lock] Lock forcefully cleared`);
    }
  } catch (error) {
    console.error(`[Bot Lock] Error clearing lock:`, error);
  }
}

/**
 * Get current lock status (for debugging)
 */
export async function getLockStatus(): Promise<BotLock | null> {
  try {
    if (!fs.existsSync(LOCK_FILE)) {
      return null;
    }

    const content = fs.readFileSync(LOCK_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[Bot Lock] Error reading lock status:`, error);
    return null;
  }
}
