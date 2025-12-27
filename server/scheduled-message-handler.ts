/**
 * Scheduled Message Handler
 * Manages cron jobs for automated Discord messages
 */

import * as cron from 'node-cron';
import type { Client, TextChannel } from 'discord.js';
import { getDb } from './db.js';
import { scheduledMessages, scheduledMessageLogs } from '../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';

interface ScheduledJob {
  id: number;
  name: string;
  task: any; // cron.ScheduledTask
}

const activeJobs = new Map<number, ScheduledJob>();

/**
 * Convert schedule preset to cron expression
 */
function scheduleToCron(schedule: string): string {
  switch (schedule) {
    case 'daily':
      // Daily at noon ET (12:00 PM ET = 17:00 UTC in winter, 16:00 UTC in summer)
      // Using 17:00 UTC as default
      return '0 17 * * *';
    
    case 'weekly':
      // Weekly on Monday at noon ET
      return '0 17 * * 1';
    
    case 'bidding_window':
      // Before bidding windows (11:50 AM and 11:50 PM ET)
      // 11:50 AM ET = 16:50 UTC, 11:50 PM ET = 4:50 UTC
      return '50 4,16 * * *';
    
    default:
      // Assume it's already a cron expression
      return schedule;
  }
}

/**
 * Calculate next run time from cron expression
 * Approximates next run based on current time + typical interval
 */
function getNextRunTime(cronExpression: string): Date {
  // Simple approximation - in production, use a proper cron parser
  const now = new Date();
  
  // For daily schedules, add 24 hours
  if (cronExpression.includes('* * *')) {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
  
  // For weekly schedules, add 7 days
  if (cronExpression.includes('* * 1')) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  // For bidding windows (twice daily), add 12 hours
  if (cronExpression.includes('4,16')) {
    return new Date(now.getTime() + 12 * 60 * 60 * 1000);
  }
  
  // Default: add 1 hour
  return new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Send a scheduled message to Discord
 */
export async function sendScheduledMessage(channelId: string, message: string, client?: Client): Promise<void> {
  if (!client) {
    console.error('[Scheduled Messages] Discord client not available');
    return;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || !channel.isTextBased()) {
      console.error(`[Scheduled Messages] Channel ${channelId} not found or not text-based`);
      return;
    }

    await (channel as TextChannel).send(message);
    console.log(`[Scheduled Messages] Sent message to channel ${channelId}`);
  } catch (error) {
    console.error(`[Scheduled Messages] Failed to send message to channel ${channelId}:`, error);
    throw error;
  }
}

/**
 * Create and start a cron job for a scheduled message
 */
async function createJob(messageId: number, name: string, schedule: string, channelId: string, message: string, client: Client): Promise<void> {
  // Stop existing job if any
  if (activeJobs.has(messageId)) {
    activeJobs.get(messageId)!.task.stop();
    activeJobs.delete(messageId);
  }

  const cronExpression = scheduleToCron(schedule);

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    console.error(`[Scheduled Messages] Invalid cron expression for message ${messageId}: ${cronExpression}`);
    return;
  }

  // Create cron job
  const task = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduled Messages] Executing job: ${name} (ID: ${messageId})`);
    
    const db = await getDb();
    let attemptNumber = 1;
    let success = false;
    let errorMessage: string | null = null;
    
    // Try up to 3 times
    while (attemptNumber <= 3 && !success) {
      try {
        // Send message
        await sendScheduledMessage(channelId, message, client);
        success = true;
        
        // Log success
        if (db) {
          await db.insert(scheduledMessageLogs).values({
            messageId: messageId,
            status: 'success',
            attemptNumber: attemptNumber,
            errorMessage: null,
          });
        }
        
        console.log(`[Scheduled Messages] Job succeeded: ${name} (Attempt ${attemptNumber})`);
      } catch (error: any) {
        errorMessage = error?.message || String(error);
        console.error(`[Scheduled Messages] Job attempt ${attemptNumber} failed for ${name}:`, error);
        
        if (attemptNumber < 3) {
          // Log retry
          if (db) {
            await db.insert(scheduledMessageLogs).values({
              messageId: messageId,
              status: 'retrying',
              attemptNumber: attemptNumber,
              errorMessage: errorMessage,
            });
          }
          
          // Wait 5 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          attemptNumber++;
        } else {
          // Final failure
          if (db) {
            await db.insert(scheduledMessageLogs).values({
              messageId: messageId,
              status: 'failed',
              attemptNumber: attemptNumber,
              errorMessage: errorMessage,
            });
          }
          console.error(`[Scheduled Messages] Job failed after ${attemptNumber} attempts: ${name}`);
        }
      }
    }
    
    // Update lastRun and nextRun in database
    if (db) {
      const nextRun = getNextRunTime(cronExpression);
      await db
        .update(scheduledMessages)
        .set({ 
          lastRun: new Date(),
          nextRun: nextRun
        })
        .where(eq(scheduledMessages.id, messageId));
    }
  });

  task.start();
  activeJobs.set(messageId, { id: messageId, name, task });
  
  console.log(`[Scheduled Messages] Started job: ${name} (ID: ${messageId}, Schedule: ${cronExpression})`);
}

/**
 * Load all enabled scheduled messages from database and start cron jobs
 */
export async function initializeScheduledMessages(client: Client): Promise<void> {
  console.log('[Scheduled Messages] Initializing scheduled messages...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Scheduled Messages] Database not available');
    return;
  }

  try {
    // Get all enabled scheduled messages
    const messages = await db.select().from(scheduledMessages);
    const enabledMessages = messages.filter(msg => msg.enabled);

    console.log(`[Scheduled Messages] Found ${enabledMessages.length} enabled scheduled messages`);

    // Create cron jobs for each message
    for (const msg of enabledMessages) {
      await createJob(msg.id, msg.name, msg.schedule, msg.channelId, msg.message, client);
      
      // Update nextRun if not set
      if (!msg.nextRun) {
        const cronExpression = scheduleToCron(msg.schedule);
        const nextRun = getNextRunTime(cronExpression);
        await db
          .update(scheduledMessages)
          .set({ nextRun })
          .where(eq(scheduledMessages.id, msg.id));
      }
    }

    console.log(`[Scheduled Messages] Initialization complete. ${activeJobs.size} jobs active.`);
  } catch (error) {
    console.error('[Scheduled Messages] Failed to initialize:', error);
  }
}

/**
 * Reload a specific scheduled message (after update)
 */
export async function reloadScheduledMessage(messageId: number, client: Client): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const result = await db.select().from(scheduledMessages).where(eq(scheduledMessages.id, messageId));
  const msg = result[0];

  if (!msg) {
    // Message deleted, stop job
    if (activeJobs.has(messageId)) {
      activeJobs.get(messageId)!.task.stop();
      activeJobs.delete(messageId);
      console.log(`[Scheduled Messages] Stopped job for deleted message ID: ${messageId}`);
    }
    return;
  }

  if (msg.enabled) {
    // Create/update job
    await createJob(msg.id, msg.name, msg.schedule, msg.channelId, msg.message, client);
  } else {
    // Stop job if disabled
    if (activeJobs.has(messageId)) {
      activeJobs.get(messageId)!.task.stop();
      activeJobs.delete(messageId);
      console.log(`[Scheduled Messages] Stopped job: ${msg.name} (ID: ${messageId})`);
    }
  }
}

/**
 * Stop all scheduled message jobs (for cleanup)
 */
export function stopAllScheduledMessages(): void {
  console.log(`[Scheduled Messages] Stopping all ${activeJobs.size} active jobs...`);
  
  activeJobs.forEach((job) => {
    job.task.stop();
  });
  
  activeJobs.clear();
  console.log('[Scheduled Messages] All jobs stopped');
}

/**
 * Get status of all active jobs
 */
export function getActiveJobs(): Array<{ id: number; name: string }> {
  const jobs: Array<{ id: number; name: string }> = [];
  activeJobs.forEach((job) => {
    jobs.push({ id: job.id, name: job.name });
  });
  return jobs;
}
