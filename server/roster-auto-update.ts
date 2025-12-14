/**
 * Roster Auto-Update Handler
 * Automatically checks rosters, updates overcap roles, and posts cap status to Discord
 */

import * as cron from 'node-cron';
import type { Client } from 'discord.js';
import { updateCapStatusMessage } from './discord-bot.js';
import { updateOvercapRoles } from './overcap-roles.js';

const ROSTER_CHANNEL_ID = '1280019275679137865';
const MESSAGE_ID_1 = '1440840389882941603';
const MESSAGE_ID_2 = '1440840392562970674';
const WEBSITE_URL = 'https://tinyurl.com/hof2k';

let rosterUpdateJob: cron.ScheduledTask | null = null;

/**
 * Run the roster auto-update process
 */
async function runRosterUpdate(client: Client): Promise<void> {
  try {
    console.log('[Roster Auto-Update] Starting daily roster update...');
    
    // Step 1: Update overcap roles (non-blocking, errors won't stop the update)
    console.log('[Roster Auto-Update] Updating overcap roles...');
    try {
      await updateOvercapRoles(client);
      console.log('[Roster Auto-Update] Overcap roles updated successfully');
    } catch (error) {
      console.error('[Roster Auto-Update] Error updating overcap roles (continuing anyway):', error);
    }
    
    // Step 2: Update cap status messages in Discord
    console.log('[Roster Auto-Update] Updating cap status messages...');
    const result = await updateCapStatusMessage(
      ROSTER_CHANNEL_ID,
      MESSAGE_ID_1,
      WEBSITE_URL,
      MESSAGE_ID_2
    );
    
    if (result.success) {
      console.log(`[Roster Auto-Update] ✅ Successfully updated cap status for ${result.teamCount} teams`);
    } else {
      console.error('[Roster Auto-Update] ❌ Failed to update cap status messages');
    }
    
  } catch (error) {
    console.error('[Roster Auto-Update] Error during roster update:', error);
  }
}

/**
 * Initialize roster auto-update cron job
 * Runs daily at 12:00 PM ET (5:00 PM UTC in winter, 4:00 PM UTC in summer)
 */
export function initializeRosterAutoUpdate(client: Client): void {
  console.log('[Roster Auto-Update] Initializing roster auto-update...');
  
  // Stop existing job if any
  if (rosterUpdateJob) {
    rosterUpdateJob.stop();
    rosterUpdateJob = null;
  }
  
  // Schedule daily at 12:00 PM ET (17:00 UTC in winter)
  // Cron format: second minute hour day month dayOfWeek
  const cronExpression = '0 0 17 * * *'; // Every day at 17:00 UTC (12:00 PM ET)
  
  rosterUpdateJob = cron.schedule(cronExpression, async () => {
    await runRosterUpdate(client);
  });
  
  console.log('[Roster Auto-Update] ✅ Roster auto-update initialized (runs daily at 12:00 PM ET)');
  
  // Run immediately on startup (after 10 seconds delay)
  setTimeout(async () => {
    console.log('[Roster Auto-Update] Running initial roster update...');
    await runRosterUpdate(client);
  }, 10000);
}

/**
 * Stop roster auto-update cron job
 */
export function stopRosterAutoUpdate(): void {
  if (rosterUpdateJob) {
    rosterUpdateJob.stop();
    rosterUpdateJob = null;
    console.log('[Roster Auto-Update] Roster auto-update stopped');
  }
}

/**
 * Manually trigger roster update (for testing or manual execution)
 */
export async function manualRosterUpdate(client: Client): Promise<void> {
  console.log('[Roster Auto-Update] Manual roster update triggered');
  await runRosterUpdate(client);
}
