// @ts-nocheck
/**
 * Streamlined Discord Bot - Core Features Only
 * 
 * Features included:
 * - FA (Free Agency) system with bidding
 * - Trade voting and approval
 * - Team role management
 * - Cap violation monitoring
 * - Custom commands
 * - Roster auto-updates
 * 
 * All other features removed for reliability and simplicity.
 */

import type { Message, ButtonInteraction } from 'discord.js';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDb, assertDb } from './db';
import { validateTeamName } from './team-validator';
import { players, teamCoins, faTransactions, faBids } from '../drizzle/schema';
import { eq, sql, and } from 'drizzle-orm';
import { extract } from 'fuzzball';
import { normalizeName } from './name-normalizer';
import { handleTradeMessage } from './trade-handler';
import { getConfig } from './bot-config-loader.js';
import fs from 'fs';
import path from 'path';

const FA_CHANNEL_ID = '1095812920056762510';
const TRADE_CHANNEL_ID = '1087524540634116116';
const GUILD_ID = '860782751656837140';
const MIN_MESSAGE_ID = '1438598608533454889';

interface ParsedTransaction {
  dropPlayer: string;
  signPlayer: string;
  signPlayerOvr?: number;
  bidAmount: number;
  detectedTeam?: string;
}

let client: Client | null = null;
let pendingTransactions: ParsedTransaction[] = [];

// Track processed messages to prevent duplicates
const processedMessages = new Set<string>();
const MESSAGE_CACHE_SIZE = 1000;
const MESSAGE_CACHE_TTL = 60000; // 1 minute

// Track processed reactions
const processedReactions = new Set<string>();
const REACTION_CACHE_SIZE = 1000;
const REACTION_CACHE_TTL = 60000;

// Track processed commands
const globalAny = global as any;
if (!globalAny.__processedCommands) {
  globalAny.__processedCommands = new Set<string>();
}
if (!globalAny.__commandsInProgress) {
  globalAny.__commandsInProgress = new Set<string>();
}
const processedCommands: Set<string> = globalAny.__processedCommands;
const commandsInProgress: Set<string> = globalAny.__commandsInProgress;
const COMMAND_CACHE_SIZE = 1000;
const COMMAND_CACHE_TTL = 60000;

// Bot instance management
const INSTANCE_ID = Math.random().toString(36).substring(7);
let lockRefreshInterval: NodeJS.Timeout | null = null;
let lockRefreshFailureCount = 0;
const MAX_LOCK_REFRESH_FAILURES = 100;

/**
 * Parse FA transaction message
 */
function parseTransaction(message: string): ParsedTransaction | null {
  const text = message.trim();
  
  const cutPattern = /(?:cut|drop|cutting|dropping|release|releasing)[:\s]+([^.\n]+?)(?:[.,]|\n|$)/i;
  const cutMatch = text.match(cutPattern);
  
  const signPattern = /(?:sign|add|signing|adding|pick\s*up|pickup)[:\s]+([^.\n]+?)(?:[.,]|\n|$)/i;
  const signMatch = text.match(signPattern);
  
  let signPlayerOvr: number | undefined;
  if (signMatch) {
    const ovrMatch = text.match(/(?:sign|add)[^.\n]*?(?:,\s*(\d+)|\((\d+)\))/i);
    if (ovrMatch) {
      signPlayerOvr = parseInt(ovrMatch[1] || ovrMatch[2]);
    }
  }
  
  const bidPattern = /(?:bid|bidding)[:\s]*(\d+)|(?:^|\s)(\d+)\s*coins?/i;
  const bidMatch = text.match(bidPattern);
  
  if (cutMatch && signMatch) {
    const dropPlayer = cutMatch[1].trim().replace(/[,.:;]$/, '');
    let signPlayer = signMatch[1].trim().replace(/[,.:;]$/, '');
    signPlayer = signPlayer.replace(/,?\s*\d+$/, '').replace(/\(\d+\)/, '').trim();
    const bidAmount = bidMatch ? parseInt(bidMatch[1] || bidMatch[2]) : 1;
    
    return {
      dropPlayer,
      signPlayer,
      signPlayerOvr,
      bidAmount
    };
  }
  
  return null;
}

/**
 * Find player by fuzzy name matching
 */
async function findPlayerByName(name: string): Promise<{ id: string; name: string; team: string; overall: number } | null> {
  const db = await getDb();
  assertDb(db);
  if (!db) return null;
  
  const allPlayers = await db.select().from(players);
  const matches = extract(name, allPlayers.map(p => p.name), { limit: 1, cutoff: 70 });
  assertDb(db);
  
  if (matches.length > 0) {
    const matchedName = matches[0][0];
    const player = allPlayers.find(p => normalizeName(p.name) === normalizeName(matchedName));
    if (player && player.team) {
      return {
        id: player.id,
        name: player.name,
        team: player.team,
        overall: player.overall
      };
    }
  }
  
  return null;
}

/**
 * Get or create team coins record
 */
async function getTeamCoins(team: string): Promise<{ coinsRemaining: number }> {
  const db = await getDb();
  assertDb(db);
  if (!db) throw new Error('Database connection failed');
  
  const { isValidTeam } = await import('./team-validator');
  assertDb(db);
  if (!isValidTeam(team)) {
    throw new Error(`Invalid team name: ${team}`);
  }
  
  const existing = await db.select().from(teamCoins).where(eq(teamCoins.team, team));
  
  if (existing.length > 0) {
    return { coinsRemaining: existing[0].coinsRemaining };
  }
  
  const initialCoins = (team === 'Nuggets' || team === 'Hawks') ? 115 : 100;
  await db.insert(teamCoins).values({ team, coinsRemaining: initialCoins });
  
  return { coinsRemaining: initialCoins };
}

/**
 * Check if team is over cap
 */
async function isTeamOverCap(team: string): Promise<boolean> {
  const db = await getDb();
  assertDb(db);
  if (!db) return false;
  
  const teamPlayers = await db.select().from(players).where(eq(players.team, team));
  const totalCap = teamPlayers.reduce((sum, p) => sum + (p.salaryCap || p.overall), 0);
  
  return totalCap > 1098;
}

/**
 * Process approved FA transactions
 */
async function processTransactions(transactions: ParsedTransaction[], adminUser: string): Promise<{ success: number; failed: number; details: string[]; coinSummary: Map<string, number> }> {
  const db = await getDb();
  assertDb(db);
  if (!db) throw new Error('Database connection failed');
  
  let success = 0;
  let failed = 0;
  const details: string[] = [];
  const coinSummary = new Map<string, number>();
  
  for (const transaction of transactions) {
    try {
      const droppedPlayer = await findPlayerByName(transaction.dropPlayer);
      
      if (!droppedPlayer) {
        failed++;
        details.push(`❌ ${transaction.dropPlayer} not found in database`);
        continue;
      }
      
      const team = droppedPlayer.team;
      
      const signedPlayer = await findPlayerByName(transaction.signPlayer);
      
      if (!signedPlayer) {
        failed++;
        details.push(`❌ ${transaction.signPlayer} not found in database`);
        continue;
      }
      
      const teamCoinsData = await getTeamCoins(team);
      let bidAmount = transaction.bidAmount;
      
      const overCap = await isTeamOverCap(team);
      if (overCap && signedPlayer.overall === 70) {
        bidAmount = 0;
        details.push(`🟢 ${team}: 70 OVR exception applied (0 coins)`);
      }
      
      if (teamCoinsData.coinsRemaining < bidAmount) {
        failed++;
        details.push(`❌ ${team}: Insufficient coins (${teamCoinsData.coinsRemaining} remaining, ${bidAmount} needed)`);
        continue;
      }
      
      if (teamCoinsData.coinsRemaining === 0 && signedPlayer.overall > 70) {
        failed++;
        details.push(`❌ ${team}: Cannot sign ${signedPlayer.name} (${signedPlayer.overall} OVR) - teams with 0 coins can only sign 70 OVR or lower`);
        continue;
      }
      
      const newCoinsRemaining = teamCoinsData.coinsRemaining - bidAmount;
      await db
        .update(teamCoins)
        .set({ coinsRemaining: newCoinsRemaining })
        .where(eq(teamCoins.team, team));
      
      const validTeam = validateTeamName(team);
      if (!validTeam) {
        console.error(`[FA Transactions] Invalid team name: ${team}`);
        continue;
      }
      
      await db
        .update(players)
        .set({ team: 'Free Agents' })
        .where(eq(players.id, droppedPlayer.id));
      
      await db
        .update(players)
        .set({ team: validTeam })
        .where(eq(players.id, signedPlayer.id));
      
      await db.insert(faTransactions).values({
        team,
        dropPlayer: droppedPlayer.name,
        signPlayer: signedPlayer.name,
        signPlayerOvr: signedPlayer.overall,
        bidAmount,
        adminUser,
        coinsRemaining: newCoinsRemaining
      });
      
      success++;
      coinSummary.set(team, newCoinsRemaining);
      details.push(`✅ ${team}: ${droppedPlayer.name} → ${signedPlayer.name} (${bidAmount} coins, ${newCoinsRemaining} remaining)`);
      
      console.log(`[FA Transactions] ${team}: ${droppedPlayer.name} → ${signedPlayer.name}`);
      
      // Update overcap roles after transaction
      try {
        const { updateOvercapRoles } = await import('./overcap-roles');
        await updateOvercapRoles(client!);
      } catch (error) {
        console.error('[Overcap Roles] Failed to update after transaction:', error);
      }
    } catch (error) {
      failed++;
      details.push(`❌ Error processing transaction: ${error}`);
      console.error('[FA Transactions] Error:', error);
    }
  }
  
  return { success, failed, details, coinSummary };
}

/**
 * Handle FA transaction messages
 */
async function handleFAMessage(message: Message) {
  const transaction = parseTransaction(message.content);
  
  if (transaction) {
    pendingTransactions.push(transaction);
    console.log(`[FA Transactions] Parsed transaction: ${JSON.stringify(transaction)}`);
  }
}

/**
 * Handle FA bid messages
 */
async function handleBidMessage(message: Message) {
  try {
    const { parseBidMessage, findPlayerByFuzzyName, getCurrentBiddingWindow, recordBid } = await import('./fa-bid-parser');
    
    const bidData = parseBidMessage(message.content);
    if (!bidData) {
      return;
    }
    
    const db = await getDb();
    assertDb(db);
    if (!db) return;
    
    const { teamAssignments } = await import('../drizzle/schema');
    const assignments = await db.select().from(teamAssignments).where(eq(teamAssignments.userId, message.author.id));
    
    if (assignments.length === 0) {
      await message.reply('❌ You are not assigned to a team. Please contact an admin.');
      return;
    }
    
    const userTeam = assignments[0].team;
    const { validateTeamName } = await import('./team-validator');
    const validTeam = validateTeamName(userTeam);
    
    if (!validTeam) {
      await message.reply(`❌ Invalid team assignment: ${userTeam}`);
      return;
    }
    
    const player = await findPlayerByFuzzyName(bidData.playerName);
    if (!player) {
      await message.reply(`❌ Player "${bidData.playerName}" not found. Please check the spelling.`);
      return;
    }
    
    const window = await getCurrentBiddingWindow();
    if (!window) {
      await message.reply('❌ No active bidding window. Bids can only be placed during open windows.');
      return;
    }
    
    // Validate bid amount against team coins
    const { isTeamOverCap } = await import('./cap-violation-alerts');
    const overCap = await isTeamOverCap(validTeam);
    
    const { validateBidCoins } = await import('./fa-bid-parser');
    const validation = await validateBidCoins(validTeam, bidData.bidAmount, player.overall, overCap);
    
    if (!validation.valid) {
      await message.reply(`❌ ${validation.error}`);
      return;
    }
    
    const result = await recordBid({
      team: validTeam,
      playerId: player.id,
      playerName: player.name,
      bidAmount: bidData.bidAmount,
      userId: message.author.id,
      username: message.author.tag,
      messageId: message.id,
      windowId: window.id
    });
    
    if (result.success) {
      await message.react('✅');
      
      // Check for outbid notifications
      try {
        const { checkAndNotifyOutbid } = await import('./outbid-notifications');
        await checkAndNotifyOutbid(client!, player.id, validTeam, bidData.bidAmount);
      } catch (error) {
        console.error('[Outbid Notifications] Error:', error);
      }
      
      console.log(`[FA Bids] Recorded bid: ${validTeam} - ${player.name} - $${bidData.bidAmount}`);
    } else {
      await message.reply(`❌ ${result.error}`);
    }
    
    // Check for auto-cancel of over-budget bids
    try {
      const { getActiveBids } = await import('./fa-bid-parser');
      const activeBids = await getActiveBids(validTeam);
      
      const totalBids = activeBids.reduce((sum, bid) => sum + bid.bidAmount, 0);
      const teamCoinsData = await getTeamCoins(validTeam);
      
      if (totalBids > teamCoinsData.coinsRemaining) {
        const { autoCancelOverBudgetBids, getNextHighestBidder } = await import('./fa-auto-cancel');
        await autoCancelOverBudgetBids(client!, validTeam);
      }
    } catch (error) {
      console.error('[FA Auto-Cancel] Error:', error);
    }
  } catch (error) {
    console.error('[FA Bids] Error processing bid:', error);
    await message.reply('❌ Failed to process bid. Please try again or contact an admin.');
  }
}

/**
 * Acquire bot instance lock
 */
async function acquireBotInstanceLock(): Promise<boolean> {
  try {
    const db = await getDb();
    assertDb(db);
    if (!db) {
      console.error('[Bot Lock] Database not available');
      return false;
    }
    
    const expiresAt = new Date(Date.now() + 30000);
    
    try {
      await db.execute(sql`
        INSERT INTO bot_instance_lock (instanceId, expiresAt)
        VALUES (${INSTANCE_ID}, ${expiresAt})
        ON DUPLICATE KEY UPDATE
          instanceId = IF(expiresAt < NOW(), VALUES(instanceId), instanceId),
          expiresAt = IF(expiresAt < NOW(), VALUES(expiresAt), expiresAt)
      `);
      
      const result = await db.execute(sql`SELECT instanceId FROM bot_instance_lock WHERE id = 1`);
      const rows = result.rows as any[];
      
      if (rows.length > 0 && rows[0].instanceId === INSTANCE_ID) {
        console.log(`[Bot Lock] Instance ${INSTANCE_ID} acquired lock`);
        return true;
      }
      
      console.log(`[Bot Lock] Instance ${INSTANCE_ID} failed to acquire lock (held by ${rows[0]?.instanceId})`);
      return false;
    } catch (error) {
      console.error('[Bot Lock] Error acquiring lock:', error);
      return false;
    }
  } catch (error) {
    console.error('[Bot Lock] Fatal error:', error);
    return false;
  }
}

/**
 * Release bot instance lock
 */
async function releaseBotInstanceLock(): Promise<void> {
  try {
    const db = await getDb();
    assertDb(db);
    if (!db) return;
    
    await db.execute(sql`DELETE FROM bot_instance_lock WHERE instanceId = ${INSTANCE_ID}`);
    console.log(`[Bot Lock] Instance ${INSTANCE_ID} released lock`);
  } catch (error) {
    console.error('[Bot Lock] Error releasing lock:', error);
  }
}

/**
 * Refresh bot instance lock
 */
async function refreshBotInstanceLock(): Promise<void> {
  try {
    const db = await getDb();
    assertDb(db);
    if (!db) {
      lockRefreshFailureCount++;
      console.error(`[Bot Lock] Refresh failed (count: ${lockRefreshFailureCount}/${MAX_LOCK_REFRESH_FAILURES}): Database not available`);
      
      if (lockRefreshFailureCount >= MAX_LOCK_REFRESH_FAILURES) {
        console.error('[Bot Lock] Max refresh failures reached, stopping bot');
        await stopDiscordBot();
      }
      return;
    }
    
    const expiresAt = new Date(Date.now() + 30000);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Lock refresh timeout')), 10000)
    );
    
    const refreshPromise = db.execute(sql`
      UPDATE bot_instance_lock 
      SET expiresAt = ${expiresAt} 
      WHERE instanceId = ${INSTANCE_ID}
    `);
    
    await Promise.race([refreshPromise, timeoutPromise]);
    
    lockRefreshFailureCount = 0;
  } catch (error) {
    lockRefreshFailureCount++;
    console.error(`[Bot Lock] Refresh failed (count: ${lockRefreshFailureCount}/${MAX_LOCK_REFRESH_FAILURES}):`, error);
    
    if (lockRefreshFailureCount >= MAX_LOCK_REFRESH_FAILURES) {
      console.error('[Bot Lock] Max refresh failures reached, stopping bot');
      await stopDiscordBot();
    }
  }
}

function startLockRefresh(): void {
  lockRefreshInterval = setInterval(refreshBotInstanceLock, 15000);
  console.log('[Bot Lock] Started lock refresh interval');
}

function stopLockRefresh(): void {
  if (lockRefreshInterval) {
    clearInterval(lockRefreshInterval);
    lockRefreshInterval = null;
    console.log('[Bot Lock] Stopped lock refresh interval');
  }
}

/**
 * Start Discord bot
 */
export async function startDiscordBot(token: string) {
  console.log(`[Discord Bot] Instance ${INSTANCE_ID} attempting to start`);
  
  const lockAcquired = await acquireBotInstanceLock();
  if (!lockAcquired) {
    const errorMsg = `Instance ${INSTANCE_ID} failed to acquire lock, aborting startup`;
    console.error(`[Discord Bot] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  
  if (client) {
    console.log(`[Discord Bot] Client already exists. Destroying old client from instance ${INSTANCE_ID}`);
    client.removeAllListeners();
    await client.destroy();
    client = null;
  }
  
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction
    ]
  });
  
  console.log(`[Discord Bot] Created new client for instance ${INSTANCE_ID}`);
  
  client.once('clientReady', async () => {
    console.log(`[Discord Bot] Logged in as ${client!.user?.tag}!`);
    
    try {
      const statusFile = path.join(process.cwd(), 'bot-status.json');
      await fs.promises.writeFile(statusFile, JSON.stringify({
        online: true,
        username: client!.user?.tag || null,
        userId: client!.user?.id || null,
        readyAt: new Date().toISOString(),
      }, null, 2));
      console.log('[Discord Bot] Status file updated');
    } catch (error) {
      console.error('[Discord Bot] Failed to write status file:', error);
    }
    
    try {
      const { initializeDefaults } = await import('./bot-config-loader.js');
      await initializeDefaults();
    } catch (error) {
      console.error('[Discord Bot] Failed to initialize default configs:', error);
    }
    
    console.log(`[Discord Bot] Monitoring FA channel: ${FA_CHANNEL_ID}`);
    console.log(`[Discord Bot] React with ⚡ to trigger transaction processing`);
    
    // Initialize trade voting system
    try {
      const { initializeTradeVoting } = await import('./trade-voting');
      initializeTradeVoting(client!);
      console.log('[Trade Voting] Initialized');
    } catch (error) {
      console.error('[Trade Voting] Failed to initialize:', error);
    }
    
    // Scan for missed trade votes
    try {
      const { scanTradesForMissedVotes } = await import('./trade-voting');
      await scanTradesForMissedVotes(client!);
      console.log('[Trade Voting] Missed vote scan complete');
    } catch (error) {
      console.error('[Trade Voting] Failed to scan for missed votes:', error);
    }
    
    // Initialize cap violation monitoring
    try {
      const { initializeCapViolationMonitoring } = await import('./cap-violation-alerts');
      initializeCapViolationMonitoring(client!);
      console.log('[Cap Alerts] Initialized');
    } catch (error) {
      console.error('[Cap Alerts] Failed to initialize:', error);
    }
    
    // Initialize team role manager
    try {
      const { syncTeamRoles } = await import('./team-role-manager');
      await syncTeamRoles(client!);
      console.log('[Team Roles] Initial role sync complete');
    } catch (error) {
      console.error('[Team Roles] Failed to initialize:', error);
    }
    
    // Initialize roster auto-update
    try {
      const { initializeRosterAutoUpdate } = await import('./roster-auto-update.js');
      initializeRosterAutoUpdate(client!);
      console.log('[Roster Auto-Update] Initialized');
    } catch (error) {
      console.error('[Roster Auto-Update] Failed to initialize:', error);
    }
    
    // Start lock refresh
    startLockRefresh();
  });
  
  // Monitor role changes for team role sync
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
      if (!oldMember.roles || !newMember.roles) return;
      
      // Team role sync happens automatically through team-role-manager
      console.log(`[Team Roles] Member role updated: ${newMember.user.tag}`);
    } catch (error) {
      console.error('[Team Role Manager] Error handling role update:', error);
    }
  });
  
  // Monitor message updates for team role sync
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    try {
      if (newMessage.id === '1130885281508233316' && newMessage.channelId === '860782989280935966') {
        console.log('[Team Roles] Team message updated, syncing roles...');
        const { syncTeamRoles } = await import('./team-role-manager');
        await syncTeamRoles(client!);
      }
    } catch (error) {
      console.error('[Team Roles] Error handling message update:', error);
    }
    
    // Process edited FA bid messages
    if (newMessage.channelId === FA_CHANNEL_ID && !newMessage.author?.bot) {
      try {
        const messageKey = `msg:${newMessage.id}`;
        processedMessages.delete(messageKey);
        
        console.log(`[FA Bids] Message ${newMessage.id} was edited, reprocessing...`);
        
        const fullMessage = newMessage.partial ? await newMessage.fetch() : newMessage;
        await handleBidMessage(fullMessage as Message);
      } catch (error) {
        console.error('[FA Bids] Error reprocessing edited message:', error);
      }
    }
  });
  
  console.log(`[Discord Bot] Registering messageCreate listener for instance ${INSTANCE_ID}`);
  
  // Monitor all messages
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const messageKey = `msg:${message.id}`;
    if (processedMessages.has(messageKey)) {
      console.log(`[Message Handler] Instance ${INSTANCE_ID} skipping duplicate message ${message.id}`);
      return;
    }
    processedMessages.add(messageKey);
    
    if (processedMessages.size > MESSAGE_CACHE_SIZE) {
      const toDelete = Array.from(processedMessages).slice(0, MESSAGE_CACHE_SIZE / 2);
      toDelete.forEach(id => processedMessages.delete(id));
    }
    
    setTimeout(() => processedMessages.delete(messageKey), MESSAGE_CACHE_TTL);
    
    // Try to handle as custom command first
    try {
      const { handleCustomCommand } = await import('./custom-command-handler');
      const handled = await handleCustomCommand(message);
      if (handled) return;
    } catch (error) {
      console.error('[Custom Commands] Error handling command:', error);
    }
    
    // Check for !help command
    if (message.content.trim().toLowerCase() === '!help') {
      try {
        const db = await getDb();
        assertDb(db);
        const { botCommands } = await import('../drizzle/schema');
        const { EmbedBuilder } = await import('discord.js');
        
        const commands = await db.select().from(botCommands).where(eq(botCommands.enabled, true));
        
        const categories: Record<string, typeof commands> = {};
        for (const cmd of commands) {
          const category = cmd.category || 'General';
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(cmd);
        }
        
        const embed = new EmbedBuilder()
          .setTitle('🤖 Bot Commands')
          .setDescription('Here are all available commands:')
          .setColor(0x5865F2);
        
        for (const [category, cmds] of Object.entries(categories)) {
          const commandList = cmds
            .map(cmd => {
              let text = `**${cmd.command}**\n${cmd.description}`;
              if (cmd.example) {
                text += `\n*Example:* \`${cmd.example}\``;
              }
              return text;
            })
            .join('\n\n');
          
          embed.addFields({
            name: `📁 ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            value: commandList || 'No commands',
            inline: false
          });
        }
        
        embed.setFooter({ text: 'Use commands in their respective channels' });
        
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('[Help Command] Error:', error);
        await message.reply('❌ Failed to fetch command list.');
      }
      return;
    }
    
    if (message.channelId === FA_CHANNEL_ID) {
      // Check for update cap status command
      const updateCapCommand = message.content.trim().toLowerCase();
      if (updateCapCommand === '/updatecap' || updateCapCommand === '!update-cap' || updateCapCommand === '!updatecap') {
        try {
          await message.reply('🔄 Updating cap status messages...');
          
          const db = await getDb();
          assertDb(db);
          if (!db) {
            await message.reply('❌ Database not available.');
            return;
          }
          
          const { discordConfig } = await import('../drizzle/schema');
          const configs = await db.select().from(discordConfig).limit(1);
          
          if (configs.length === 0 || !configs[0].channelId || !configs[0].messageId || !configs[0].websiteUrl) {
            assertDb(db);
            await message.reply('❌ Cap status messages not configured.');
            return;
          }
          
          const config = configs[0];
          await updateCapStatusMessage(config.channelId!, config.messageId!, config.websiteUrl!, config.messageId2 || undefined);
          
          await message.reply('✅ Cap status messages updated successfully!');
        } catch (error) {
          console.error('[Update Cap] Command failed:', error);
          await message.reply('❌ Failed to update cap status.');
        }
        return;
      }
      
      // Handle FA bid messages
      if (message.id > MIN_MESSAGE_ID) {
        await handleBidMessage(message);
      }
    }
    
    if (message.channelId === TRADE_CHANNEL_ID) {
      // Check for !scan-trades command
      if (message.content.trim().toLowerCase() === '!scan-trades') {
        try {
          await message.reply('🔄 Scanning for missed trade votes...');
          const { scanTradesForMissedVotes } = await import('./trade-voting');
          await scanTradesForMissedVotes(client!);
          await message.reply('✅ Trade scan complete!');
        } catch (error) {
          console.error('[Trade Scan] Command failed:', error);
          await message.reply('❌ Failed to scan trades.');
        }
        return;
      }
      
      // Check for !check-trade command
      if (message.content.trim().toLowerCase().startsWith('!check-trade')) {
        try {
          const parts = message.content.trim().split(/\s+/);
          if (parts.length < 2) {
            await message.reply('❌ Usage: !check-trade <message_id>');
            return;
          }
          
          const tradeMessageId = parts[1];
          const { checkTradeVotes } = await import('./trade-voting');
          await checkTradeVotes(client!, tradeMessageId, message.channelId);
        } catch (error) {
          console.error('[Check Trade] Command failed:', error);
          await message.reply('❌ Failed to check trade votes.');
        }
        return;
      }
      
      // Handle trade messages
      await handleTradeMessage(message, client!);
    }
    
    // Check for !sync-team-roles command
    if (message.content.trim().toLowerCase() === '!sync-team-roles') {
      try {
        await message.reply('🔄 Syncing team roles...');
        const { syncTeamRoles } = await import('./team-role-manager');
        await syncTeamRoles(client!);
        await message.reply('✅ Team roles synced successfully!');
      } catch (error) {
        console.error('[Team Roles] Sync command failed:', error);
        await message.reply('❌ Failed to sync team roles.');
      }
      return;
    }
  });
  
  // Monitor reactions for FA and trade processing
  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    
    const reactionKey = `reaction:${reaction.message.id}:${user.id}:${reaction.emoji.name}`;
    if (processedReactions.has(reactionKey)) {
      return;
    }
    processedReactions.add(reactionKey);
    
    if (processedReactions.size > REACTION_CACHE_SIZE) {
      const toDelete = Array.from(processedReactions).slice(0, REACTION_CACHE_SIZE / 2);
      toDelete.forEach(id => processedReactions.delete(id));
    }
    
    setTimeout(() => processedReactions.delete(reactionKey), REACTION_CACHE_TTL);
    
    try {
      if (reaction.partial) {
        await reaction.fetch();
      }
      
      const message = reaction.message;
      
      // Handle FA transaction approval (⚡ emoji)
      if (message.channelId === FA_CHANNEL_ID && reaction.emoji.name === '⚡') {
        console.log(`[FA Transactions] ⚡ reaction detected on message ${message.id}`);
        
        if (pendingTransactions.length === 0) {
          await message.reply('❌ No pending transactions to process.');
          return;
        }
        
        const result = await processTransactions(pendingTransactions, user.tag);
        
        let summary = `**FA Transaction Summary**\n\n`;
        summary += `✅ Success: ${result.success}\n`;
        summary += `❌ Failed: ${result.failed}\n\n`;
        
        if (result.details.length > 0) {
          summary += result.details.join('\n');
        }
        
        if (result.coinSummary.size > 0) {
          summary += `\n\n**Coin Balances:**\n`;
          for (const [team, coins] of result.coinSummary) {
            summary += `${team}: ${coins} coins\n`;
          }
        }
        
        await message.reply(summary);
        
        pendingTransactions = [];
      }
      
      // Handle trade approval (handled by trade-voting.ts)
      if (message.channelId === TRADE_CHANNEL_ID) {
        const { handleTradeReaction } = await import('./trade-voting');
        await handleTradeReaction(reaction, user, client!);
      }
      
      // Handle trade reversal (⏪ emoji)
      if (message.channelId === TRADE_CHANNEL_ID && reaction.emoji.name === '⏪') {
        const { handleTradeReversal } = await import('./trade-reversal-handler');
        await handleTradeReversal(message, user, client!);
      }
    } catch (error) {
      console.error('[Reaction Handler] Error:', error);
    }
  });
  
  // Handle errors
  client.on('error', (error) => {
    console.error('[Discord Bot] Client error:', error);
  });
  
  // Handle disconnects
  client.on('disconnect', () => {
    console.warn('[Discord Bot] Disconnected from Discord');
  });
  
  await client.login(token);
  console.log(`[Discord Bot] Instance ${INSTANCE_ID} login initiated`);
}

/**
 * Stop Discord bot
 */
export async function stopDiscordBot() {
  console.log('[Discord Bot] Stopping...');
  
  stopLockRefresh();
  
  try {
    const { stopRosterAutoUpdate } = await import('./roster-auto-update.js');
    stopRosterAutoUpdate();
  } catch (error) {
    console.error('[Roster Auto-Update] Failed to stop:', error);
  }
  
  if (client) {
    client.removeAllListeners();
    await client.destroy();
    client = null;
    console.log('[Discord Bot] Stopped');
  }
  
  try {
    const statusFile = path.join(process.cwd(), 'bot-status.json');
    await fs.promises.writeFile(statusFile, JSON.stringify({
      online: false,
      username: null,
      userId: null,
      stoppedAt: new Date().toISOString(),
    }, null, 2));
    console.log('[Discord Bot] Status file updated to offline');
  } catch (error) {
    console.error('[Discord Bot] Failed to update status file on stop:', error);
  }
  
  await releaseBotInstanceLock();
}

/**
 * Get Discord client instance
 */
export function getDiscordClient(): Client | null {
  return client;
}

/**
 * Get Discord bot status
 */
export function getDiscordBotStatus() {
  console.log('[Discord Bot Status] Checking status...');
  console.log('[Discord Bot Status] Client exists:', !!client);
  
  if (!client) {
    console.log('[Discord Bot Status] No client - returning offline');
    return {
      online: false,
      username: null,
      channelId: FA_CHANNEL_ID,
      guildId: GUILD_ID
    };
  }
  
  const isReady = client.isReady();
  const username = client.user?.tag || null;
  
  console.log('[Discord Bot Status] client.isReady():', isReady);
  console.log('[Discord Bot Status] client.user?.tag:', username);
  
  return {
    online: isReady,
    username: username,
    channelId: FA_CHANNEL_ID,
    guildId: GUILD_ID
  };
}

/**
 * Post cap status message to Discord channel
 */
export async function postCapStatusToChannel(channelId: string, websiteUrl: string): Promise<{ success: boolean; messageId: string | null; messageId2?: string | null; teamCount: number }> {
  if (!client || !client.isReady()) {
    throw new Error('Discord bot is not connected');
  }

  try {
    const { getTeamSummaries, generateDiscordEmbed } = await import('./discord.js');
    
    const summaries = await getTeamSummaries();
    const embedData = generateDiscordEmbed(summaries, websiteUrl);
    
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel or channel is not text-based');
    }

    const message1 = await (channel as any).send({
      content: '@everyone',
      embeds: [embedData.embeds[0]]
    });

    console.log(`[Bot] Posted cap status part 1 to channel ${channelId}, message ID: ${message1.id}`);
    
    const message2 = await (channel as any).send({
      embeds: [embedData.embeds[1]]
    });

    console.log(`[Bot] Posted cap status part 2 to channel ${channelId}, message ID: ${message2.id}`);
    
    return {
      success: true,
      messageId: message1.id,
      messageId2: message2.id,
      teamCount: summaries.length
    };
  } catch (error) {
    console.error('[Bot] Failed to post cap status:', error);
    throw error;
  }
}

/**
 * Update existing cap status message
 */
export async function updateCapStatusMessage(channelId: string, messageId: string, websiteUrl: string, messageId2?: string): Promise<{ success: boolean; teamCount: number }> {
  if (!client || !client.isReady()) {
    throw new Error('Discord bot is not connected');
  }

  try {
    const { getTeamSummaries, generateDiscordEmbed } = await import('./discord.js');
    
    const summaries = await getTeamSummaries();
    const embedData = generateDiscordEmbed(summaries, websiteUrl);
    
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel or channel is not text-based');
    }

    const message1 = await channel.messages.fetch(messageId);
    await message1.edit({
      embeds: [embedData.embeds[0]]
    });

    console.log(`[Bot] Updated cap status message part 1 ${messageId} in channel ${channelId}`);
    
    if (messageId2) {
      const message2 = await channel.messages.fetch(messageId2);
      await message2.edit({
        embeds: [embedData.embeds[1]]
      });
      console.log(`[Bot] Updated cap status message part 2 ${messageId2} in channel ${channelId}`);
    }
    
    return {
      success: true,
      teamCount: summaries.length
    };
  } catch (error) {
    console.error('[Bot] Failed to update cap status:', error);
    throw error;
  }
}

// Start the bot if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('[Discord Bot] DISCORD_BOT_TOKEN environment variable is not set');
    process.exit(1);
  }
  
  startDiscordBot(token).catch((error) => {
    console.error('[Discord Bot] Failed to start:', error);
    process.exit(1);
  });
}
