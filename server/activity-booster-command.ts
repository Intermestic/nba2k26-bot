// @ts-nocheck
import { Client, Message, TextChannel, EmbedBuilder } from 'discord.js';
import { getDb } from './db';
import { activityRecords, activityCheckpoint, activityHeadToHead, activityProcessedMessages } from '../drizzle/schema';
import { parseActivityBoosterMessage, ParsedActivityBooster } from './activity-booster-parser';
import { eq, and, or, sql } from 'drizzle-orm';

const ACTIVITY_BOOSTER_CHANNEL_ID = '1384397576606056579';
const HEAD_TO_HEAD_LOG_CHANNEL_ID = '1443741234106470493';
const CUTOFF_MESSAGE_ID = '1440851551030870147';
const EXECUTION_LOCK_TTL = 30000; // 30 seconds

/**
 * Acquire a distributed lock using the database
 * Returns true if lock acquired, false if already locked
 */
async function acquireCommandLock(commandKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const expiresAt = new Date(Date.now() + EXECUTION_LOCK_TTL);
  
  try {
    // Try to insert the lock
    await db.execute(sql`
      INSERT INTO command_locks (commandKey, expiresAt)
      VALUES (${commandKey}, ${expiresAt})
    `);
    console.log(`[AB Command] Acquired lock for ${commandKey}`);
    return true;
  } catch (error: any) {
    // If insert fails due to unique constraint, check if lock is expired
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      // Try to delete expired locks and retry
      await db.execute(sql`
        DELETE FROM command_locks 
        WHERE commandKey = ${commandKey} AND expiresAt < NOW()
      `);
      
      // Retry insert
      try {
        await db.execute(sql`
          INSERT INTO command_locks (commandKey, expiresAt)
          VALUES (${commandKey}, ${expiresAt})
        `);
        console.log(`[AB Command] Acquired lock for ${commandKey} after cleanup`);
        return true;
      } catch (retryError: any) {
        if (retryError.code === 'ER_DUP_ENTRY' || retryError.errno === 1062) {
          console.log(`[AB Command] Lock already held for ${commandKey}`);
          return false;
        }
        throw retryError;
      }
    }
    throw error;
  }
}

/**
 * Release a distributed lock
 */
async function releaseCommandLock(commandKey: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.execute(sql`
    DELETE FROM command_locks WHERE commandKey = ${commandKey}
  `);
  console.log(`[AB Command] Released lock for ${commandKey}`);
}

/**
 * Activity Booster Records Command Handler
 * 
 * Command: !ab-records
 * 
 * Scans activity booster channel for game results and generates:
 * 1. Overall standings (posted in activity booster channel)
 * 2. Head-to-head matchup log (posted in log channel)
 */

interface TeamRecord {
  teamName: string;
  wins: number;
  losses: number;
  winPct: number;
}

interface HeadToHeadRecord {
  team1: string;
  team2: string;
  team1Wins: number;
  team2Wins: number;
}

/**
 * Update team record in database
 */
async function updateTeamRecord(teamName: string, isWin: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const existing = await db.select().from(activityRecords).where(eq(activityRecords.teamName, teamName)).limit(1);
  
  if (existing.length > 0) {
    // Use atomic SQL increment to prevent race conditions
    if (isWin) {
      await db.update(activityRecords)
        .set({
          wins: sql`${activityRecords.wins} + 1`,
          lastUpdated: new Date(),
        })
        .where(eq(activityRecords.teamName, teamName));
    } else {
      await db.update(activityRecords)
        .set({
          losses: sql`${activityRecords.losses} + 1`,
          lastUpdated: new Date(),
        })
        .where(eq(activityRecords.teamName, teamName));
    }
  } else {
    // Create new record
    await db.insert(activityRecords).values({
      teamName,
      wins: isWin ? 1 : 0,
      losses: !isWin ? 1 : 0,
      lastUpdated: new Date(),
    });
  }
}

/**
 * Update head-to-head record in database
 */
async function updateHeadToHead(team1: string, team2: string, team1Won: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Normalize team order (alphabetical) for consistent lookup
  const [teamA, teamB] = [team1, team2].sort();
  const teamAWon = (teamA === team1 && team1Won) || (teamA === team2 && !team1Won);
  
  const existing = await db.select()
    .from(activityHeadToHead)
    .where(
      and(
        eq(activityHeadToHead.team1, teamA),
        eq(activityHeadToHead.team2, teamB)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Use atomic SQL increment to prevent race conditions
    if (teamAWon) {
      await db.update(activityHeadToHead)
        .set({
          team1Wins: sql`${activityHeadToHead.team1Wins} + 1`,
          lastUpdated: new Date(),
        })
        .where(eq(activityHeadToHead.id, existing[0].id));
    } else {
      await db.update(activityHeadToHead)
        .set({
          team2Wins: sql`${activityHeadToHead.team2Wins} + 1`,
          lastUpdated: new Date(),
        })
        .where(eq(activityHeadToHead.id, existing[0].id));
    }
  } else {
    // Create new matchup
    await db.insert(activityHeadToHead).values({
      team1: teamA,
      team2: teamB,
      team1Wins: teamAWon ? 1 : 0,
      team2Wins: !teamAWon ? 1 : 0,
      lastUpdated: new Date(),
    });
  }
}

/**
 * Process parsed activity booster message
 * Returns true if processed, false if already exists
 */
async function processActivityBooster(message: Message, parsed: ParsedActivityBooster): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Check if this message was already processed
  const existing = await db.select()
    .from(activityProcessedMessages)
    .where(eq(activityProcessedMessages.messageId, message.id))
    .limit(1);
  
  if (existing.length > 0) {
    console.log(`[AB Command]   ⚠️  Message ${message.id} already processed, skipping`);
    return false;
  }
  
  // Record this message as processed FIRST (before updating records)
  // This ensures idempotency even if concurrent executions happen
  try {
    await db.insert(activityProcessedMessages).values({
      messageId: message.id,
      authorId: message.author.id,
      authorName: message.author.username,
      postingTeam: parsed.postingTeam,
      opponentTeam: parsed.opponentTeam,
      postingTeamResult: parsed.postingTeamResult,
      opponentTeamResult: parsed.opponentTeamResult,
      processedAt: new Date(),
    });
  } catch (error: any) {
    // If insert fails due to unique constraint, another execution already processed it
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      console.log(`[AB Command]   ⚠️  Message ${message.id} already processed by concurrent execution, skipping`);
      return false;
    }
    throw error;
  }
  
  // Update team records
  await updateTeamRecord(parsed.postingTeam, parsed.postingTeamResult === 'W');
  await updateTeamRecord(parsed.opponentTeam, parsed.opponentTeamResult === 'W');
  
  // Update head-to-head
  await updateHeadToHead(
    parsed.postingTeam,
    parsed.opponentTeam,
    parsed.postingTeamResult === 'W'
  );
  
  return true;
}

/**
 * Get all team records from database
 */
async function getAllRecords(): Promise<TeamRecord[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const records = await db.select().from(activityRecords);
  
  return records.map(r => ({
    teamName: r.teamName,
    wins: r.wins,
    losses: r.losses,
    winPct: r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : 0,
  })).sort((a, b) => {
    // Sort by win percentage, then by wins
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    return b.wins - a.wins;
  });
}

/**
 * Get all head-to-head records from database
 */
async function getAllHeadToHead(): Promise<HeadToHeadRecord[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const records = await db.select().from(activityHeadToHead);
  
  return records.map(r => ({
    team1: r.team1,
    team2: r.team2,
    team1Wins: r.team1Wins,
    team2Wins: r.team2Wins,
  })).sort((a, b) => {
    // Sort by team1 name, then team2 name
    if (a.team1 !== b.team1) return a.team1.localeCompare(b.team1);
    return a.team2.localeCompare(b.team2);
  });
}

/**
 * Generate standings message
 */
function generateStandingsMessage(records: TeamRecord[], totalGames: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('📊 Activity Booster Records')
    .setColor(0x1E90FF)
    .setTimestamp();
  
  if (records.length === 0) {
    embed.setDescription('No games recorded yet.');
    return embed;
  }
  
  let description = '```\n';
  description += 'Team                    W-L      Win%\n';
  description += '─────────────────────────────────────\n';
  
  for (const record of records) {
    const teamName = record.teamName.padEnd(20);
    const wl = `${record.wins}-${record.losses}`.padEnd(8);
    const pct = record.winPct.toFixed(3);
    description += `${teamName} ${wl} ${pct}\n`;
  }
  
  description += '```';
  
  embed.setDescription(description);
  embed.setFooter({ text: `Based on ${totalGames} games` });
  
  return embed;
}

/**
 * Generate head-to-head log message
 */
function generateHeadToHeadMessage(records: HeadToHeadRecord[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🔄 Activity Booster Head-to-Head Records')
    .setColor(0xFF6347)
    .setTimestamp();
  
  if (records.length === 0) {
    embed.setDescription('No matchups recorded yet.');
    return embed;
  }
  
  let description = '```\n';
  description += 'Team A              Team B              Record\n';
  description += '──────────────────────────────────────────────\n';
  
  for (const record of records) {
    const team1 = record.team1.padEnd(18);
    const team2 = record.team2.padEnd(18);
    const recordStr = `${record.team1Wins}-${record.team2Wins}`;
    description += `${team1} ${team2} ${recordStr}\n`;
  }
  
  description += '```';
  
  embed.setDescription(description);
  
  return embed;
}

/**
 * Scan messages and process activity boosters
 */
async function scanAndProcessMessages(
  channel: TextChannel,
  afterMessageId?: string
): Promise<{ processed: number; lastMessageId: string | null }> {
  let processed = 0;
  let lastMessageId: string | null = null;
  
  console.log(`[AB Command] Scanning messages after ${afterMessageId || 'start'}...`);
  
  // Fetch recent messages (Discord API fetches newest first)
  // We'll fetch in batches and filter for messages after our checkpoint
  let fetchBefore: string | undefined = undefined;
  let foundCheckpoint = false;
  
  while (true) {
    const options: any = { limit: 100 };
    if (fetchBefore) {
      options.before = fetchBefore;
    }
    
    const messages = await channel.messages.fetch(options);
    
    if (messages.size === 0) break;
    
    // Sort messages by timestamp (newest first, matching Discord API order)
    const sortedMessages = Array.from(messages.values()).sort(
      (a, b) => b.createdTimestamp - a.createdTimestamp
    );
    
    for (const message of sortedMessages) {
      // Skip messages before or at cutoff (use BigInt for proper comparison)
      if (BigInt(message.id) <= BigInt(CUTOFF_MESSAGE_ID)) continue;
      
      // If we have a checkpoint, skip messages at or before it
      if (afterMessageId && BigInt(message.id) <= BigInt(afterMessageId)) {
        foundCheckpoint = true;
        continue;
      }
      
      // Skip bot messages
      if (message.author.bot) continue;
      
      // Log message details
      const roles = message.member?.roles.cache.map(r => r.name).join(', ') || 'No roles';
      const contentPreview = message.content.substring(0, 80).replace(/\n/g, ' ');
      console.log(`[AB Command] Message ${message.id} by ${message.author.username} [${roles}]: "${contentPreview}..."`);
      
      // Try to parse message
      const parsed = parseActivityBoosterMessage(message);
      if (parsed) {
        console.log(`[AB Command]   ✓ Parsed: ${parsed.postingTeam} ${parsed.postingTeamResult} vs ${parsed.opponentTeam} ${parsed.opponentTeamResult}`);
        const wasProcessed = await processActivityBooster(message, parsed);
        if (wasProcessed) {
          processed++;
        }
      } else {
        console.log(`[AB Command]   ✗ Failed to parse`);
      }
      
      lastMessageId = message.id;
    }
    
    // If we found the checkpoint, we can stop scanning older messages
    if (foundCheckpoint) break;
    
    // If we got less than 100 messages, we've reached the end
    if (messages.size < 100) break;
    
    // Update fetchBefore for next iteration (go further back in time)
    fetchBefore = sortedMessages[sortedMessages.length - 1].id;
  }
  
  console.log(`[AB Command] Scan complete. Processed ${processed} games.`);
  
  return { processed, lastMessageId };
}

/**
 * Main command handler
 */
export async function handleActivityRecordsCommand(
  client: Client,
  message: Message
): Promise<void> {
  // NOTE: Lock is now acquired in discord-bot.ts before calling this function
  // This function assumes it has exclusive access
  
  try {
    await message.reply('🔄 Scanning activity booster channel...');
    
    // Get channels
    const abChannel = await client.channels.fetch(ACTIVITY_BOOSTER_CHANNEL_ID) as TextChannel;
    const logChannel = await client.channels.fetch(HEAD_TO_HEAD_LOG_CHANNEL_ID) as TextChannel;
    
    if (!abChannel || !logChannel) {
      await message.reply('❌ Could not find required channels.');
      return;
    }
    
    // Get database
    const db = await getDb();
    if (!db) {
      await message.reply('❌ Database not available.');
      return;
    }
    
    // Check for existing checkpoint to determine where to start scanning
    const checkpoints = await db.select()
      .from(activityCheckpoint)
      .orderBy(sql`${activityCheckpoint.processedAt} DESC`)
      .limit(1);
    
    const lastCheckpoint = checkpoints[0];
    const afterMessageId = lastCheckpoint?.lastProcessedMessageId || CUTOFF_MESSAGE_ID;
    
    console.log(`[AB Command] Starting incremental scan from message ${afterMessageId}`);
    console.log(`[AB Command] Last checkpoint: ${lastCheckpoint ? `${lastCheckpoint.totalGamesProcessed} games at ${lastCheckpoint.processedAt}` : 'none'}`);
    
    // Scan and process NEW messages since last checkpoint
    // Records will be ADDED to existing data (incremental + cumulative)
    const { processed, lastMessageId } = await scanAndProcessMessages(abChannel, afterMessageId);
    
    if (processed === 0) {
      await message.reply('✅ No new games to process.');
      return;
    }
    
    // Get updated records
    const records = await getAllRecords();
    const headToHead = await getAllHeadToHead();
    
    // Calculate total games
    const totalGames = records.reduce((sum, r) => sum + r.wins + r.losses, 0) / 2; // Divide by 2 since each game counts for 2 teams
    
    // Post standings in activity booster channel
    const standingsEmbed = generateStandingsMessage(records, totalGames);
    const standingsMsg = await abChannel.send({ embeds: [standingsEmbed] });
    
    // Post head-to-head log in log channel
    const h2hEmbed = generateHeadToHeadMessage(headToHead);
    await logChannel.send({ embeds: [h2hEmbed] });
    
    // Save checkpoint
    await db.insert(activityCheckpoint).values({
      lastProcessedMessageId: lastMessageId || afterMessageId,
      lastStandingsMessageId: standingsMsg.id,
      processedAt: new Date(),
      totalGamesProcessed: totalGames,
    });
    
    await message.reply(`✅ Processed ${processed} new games. Standings posted!`);
    
    console.log(`[AB Command] Command ${commandKey} completed successfully`);
    
  } catch (error) {
    console.error('[AB Command] Error:', error);
    await message.reply('❌ An error occurred while processing activity boosters.');
  }
  // NOTE: Lock is released in discord-bot.ts after this function returns
}
