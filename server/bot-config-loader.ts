/**
 * Bot Configuration Loader
 * Loads bot configuration from database and provides caching
 */

import { getDb } from './db.js';
import { botConfig, messageTemplates, botCommands } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

// Cache for config values
const configCache = new Map<string, { value: any; timestamp: number }>();
const templateCache = new Map<string, { content: string; timestamp: number }>();
const commandCache = new Map<string, { config: any; timestamp: number }>();

const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get a configuration value by key
 */
export async function getConfig(key: string, defaultValue?: string): Promise<string | null> {
  try {
    // Check cache
    const cached = configCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    // Fetch from database
    const db = await getDb();
    if (!db) return defaultValue || null;

    const result = await db.select().from(botConfig).where(eq(botConfig.key, key));
    const value = result[0]?.value || defaultValue || null;

    // Update cache
    configCache.set(key, { value, timestamp: Date.now() });

    return value;
  } catch (error) {
    console.error(`[Config Loader] Error loading config "${key}":`, error);
    return defaultValue || null;
  }
}

/**
 * Get a message template by key
 */
export async function getTemplate(key: string, defaultContent?: string): Promise<string> {
  try {
    // Check cache
    const cached = templateCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.content;
    }

    // Fetch from database
    const db = await getDb();
    if (!db) return defaultContent || '';

    const result = await db.select().from(messageTemplates).where(eq(messageTemplates.key, key));
    const content = result[0]?.content || defaultContent || '';

    // Update cache
    templateCache.set(key, { content, timestamp: Date.now() });

    return content;
  } catch (error) {
    console.error(`[Config Loader] Error loading template "${key}":`, error);
    return defaultContent || '';
  }
}

/**
 * Get a command configuration by command name
 */
export async function getCommand(command: string): Promise<any | null> {
  try {
    // Check cache
    const cached = commandCache.get(command);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.config;
    }

    // Fetch from database
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(botCommands).where(eq(botCommands.command, command));
    const config = result[0] || null;

    // Update cache
    commandCache.set(command, { config, timestamp: Date.now() });

    return config;
  } catch (error) {
    console.error(`[Config Loader] Error loading command "${command}":`, error);
    return null;
  }
}

/**
 * Check if a command is enabled
 */
export async function isCommandEnabled(command: string): Promise<boolean> {
  const config = await getCommand(command);
  return config?.enabled ?? true; // Default to enabled if not found
}

/**
 * Replace variables in a template string
 */
export function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

/**
 * Clear all caches (useful after config updates)
 */
export function clearCache() {
  configCache.clear();
  templateCache.clear();
  commandCache.clear();
  console.log('[Config Loader] Cache cleared');
}

/**
 * Initialize default configurations if they don't exist
 */
export async function initializeDefaults() {
  try {
    const db = await getDb();
    if (!db) return;

    // Check if welcome message template exists
    const welcomeTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'welcome_message'));
    
    if (welcomeTemplate.length === 0) {
      // Insert default welcome message
      await db.insert(messageTemplates).values({
        key: 'welcome_message',
        content: `<@{userId}> **Welcome to {teamName}!**

This is your private team channel. Ask questions, post upgrades, and report issues here.

**🔗 Quick Access**
• **Rosters**: <#1280019275679137865> • https://tinyurl.com/hof2k
• **Find games**: Type \`!game\` in <#1071550012917567559>
• **Open to trades**: Type \`otb\` in <#1095937321825730630>

**💰 Free Agency**
Bid in <#1095812920056762510>. Start with **100 coins** (non-transferable).
• **Windows**: Noon & Midnight ET (last bid must be in before 11:50)
• **No edits** — edited bids are invalid
• **Highest bid wins**. Ties go to worst record at lock.
• **Cut players**: Can't re-sign for 2 full windows
• **Post wins** in <#1267935048997539862>

**🔄 Trades**
New users: Play **10 games** before trading any **85+ OVR** player.

**⬆️ Upgrades**
Post in your Team Chat using the template.
• **5GM/7GM**: No summaries needed. Use Games 5 and 7 before Games 10 & 14 or lose them, no hoarding.
• **Rookie/OG (32+)**: Need 2-3 sentence summaries in <#1437621857913143416> to claim
• **Welcome UG**: Play 5 games with summaries in your first week.

**🎮 Gameplay**
• **Rules**: <#860783041165524992>
• **Quit**: OK at end of Q3 or by mutual agreement
• **Lag**: Report in chat & DM before Q2
• **Injuries**: <#1208092445934493696> • **Positions**: <#1208092367190499449>
• **Replays (Activity Boosters)**: <#1384397576606056579> original result is logged for activity credit, and the replay counts like any game.

**🏆 Playoffs**
Seeding: **60% activity, 40% record**. Top 16 teams seeded 1-16 regardless of conference.

**📊 Roster Rules**
14 players max. Total OVR must stay at/below the cap in <#1280019275679137865>.

**📌 Admin Reactions**
⏳ pending • ❓ need info • ✅ approved • ❌ denied • 📒 logged • 🎮 pushed in-game`,
        description: 'Welcome message posted to team channels when users join',
        category: 'welcome',
        variables: JSON.stringify(['userId', 'teamName', 'username']),
      });
      console.log('[Config Loader] Default welcome message template created');
    }

    // Add default commands
    const syncRolesCommand = await db.select().from(botCommands).where(eq(botCommands.command, '!sync-team-roles'));
    if (syncRolesCommand.length === 0) {
      await db.insert(botCommands).values({
        command: '!sync-team-roles',
        description: 'Manually sync team roles from the team message',
        enabled: true,
        permissions: 'admin',
        category: 'admin',
      });
    }

    const syncChannelsCommand = await db.select().from(botCommands).where(eq(botCommands.command, '!sync-team-channels'));
    if (syncChannelsCommand.length === 0) {
      await db.insert(botCommands).values({
        command: '!sync-team-channels',
        description: 'Manually sync team channels and update topics',
        enabled: true,
        permissions: 'admin',
        category: 'admin',
      });
    }

    // Add trade notification templates
    const tradeApprovedTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'trade_approved'));
    if (tradeApprovedTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'trade_approved',
        content: '✅ **TRADE APPROVED** (7+ votes)\n\nThe trade has been approved by the Trade Committee and will be processed shortly.',
        description: 'Message posted when a trade reaches 7 approval votes',
        category: 'trades',
        variables: JSON.stringify([]),
      });
    }

    const tradeRejectedTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'trade_rejected'));
    if (tradeRejectedTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'trade_rejected',
        content: '❌ **TRADE REJECTED** (5+ downvotes)\n\nThe trade has been rejected by the Trade Committee.',
        description: 'Message posted when a trade reaches 5 rejection votes',
        category: 'trades',
        variables: JSON.stringify([]),
      });
    }

    // Add FA bid templates
    const bidConfirmationTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'bid_confirmation'));
    if (bidConfirmationTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'bid_confirmation',
        content: '✅ **Bid Confirmed**\n\n**Cut:** {cutPlayer} ({cutOVR} OVR)\n**Sign:** {signPlayer} ({signOVR} OVR)\n**Bid:** ${bidAmount}\n**Team:** {teamName}\n\n{bidStatus}\n\n**Projected Cap:** {capStatus} {projectedTotal}/1098',
        description: 'Confirmation message sent when a user places a valid FA bid',
        category: 'fa',
        variables: JSON.stringify(['cutPlayer', 'cutOVR', 'signPlayer', 'signOVR', 'bidAmount', 'teamName', 'bidStatus', 'capStatus', 'projectedTotal']),
      });
    }

    const bidOutbidTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'bid_outbid'));
    if (bidOutbidTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'bid_outbid',
        content: '⚠️ **You\'ve Been Outbid!**\n\n**Player:** {playerName}\n**Your Bid:** ${yourBid}\n**New High Bid:** ${newBid}\n**Current Leader:** {leaderName}\n\nYou have **{timeRemaining}** remaining to place a higher bid.',
        description: 'DM sent to users when they are outbid on a player',
        category: 'fa',
        variables: JSON.stringify(['playerName', 'yourBid', 'newBid', 'leaderName', 'timeRemaining']),
      });
    }

    const bidWonTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'bid_won'));
    if (bidWonTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'bid_won',
        content: '🏆 **Congratulations!**\n\nYou won the bid for **{playerName}** with a bid of **${bidAmount}**!\n\nThe player will be added to your roster shortly.',
        description: 'DM sent to users when they win a FA bid',
        category: 'fa',
        variables: JSON.stringify(['playerName', 'bidAmount']),
      });
    }

    const bidLostTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'bid_lost'));
    if (bidLostTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'bid_lost',
        content: '❌ **Bid Unsuccessful**\n\nYour bid for **{playerName}** (${yourBid}) was not the highest bid.\n\n**Winner:** {winnerName} (${winningBid})',
        description: 'DM sent to users when they lose a FA bid',
        category: 'fa',
        variables: JSON.stringify(['playerName', 'yourBid', 'winnerName', 'winningBid']),
      });
    }

    // Add cap violation templates
    const capAlertTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'cap_alert'));
    if (capAlertTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'cap_alert',
        content: '⚠️ **CAP VIOLATION ALERT**\n\nYour team **{teamName}** is currently over the cap:\n\n**Total Overall:** {totalOVR}/1098 (+{overAmount})\n**Roster Size:** {rosterSize}/14\n\n**Suggested Drops:**\n{suggestedDrops}\n\nPlease reduce your roster to get back under the cap.',
        description: 'DM sent to team owners when they exceed the 1098 OVR cap',
        category: 'cap',
        variables: JSON.stringify(['teamName', 'totalOVR', 'overAmount', 'rosterSize', 'suggestedDrops']),
      });
    }

    const capResolvedTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'cap_resolved'));
    if (capResolvedTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'cap_resolved',
        content: '✅ **Cap Compliance Restored**\n\nYour team **{teamName}** is now back under the cap:\n\n**Total Overall:** {totalOVR}/1098\n**Roster Size:** {rosterSize}/14\n\nGreat work!',
        description: 'DM sent to team owners when they get back under cap after violation',
        category: 'cap',
        variables: JSON.stringify(['teamName', 'totalOVR', 'rosterSize']),
      });
    }

    // Add general notification templates
    const rosterUpdateTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'roster_update'));
    if (rosterUpdateTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'roster_update',
        content: '📊 **Roster Update**\n\n{updateDetails}',
        description: 'General roster update notification',
        category: 'notifications',
        variables: JSON.stringify(['updateDetails']),
      });
    }

    const windowCloseTemplate = await db.select().from(messageTemplates).where(eq(messageTemplates.key, 'window_close'));
    if (windowCloseTemplate.length === 0) {
      await db.insert(messageTemplates).values({
        key: 'window_close',
        content: '🔒 **Bidding Window Closed**\n\nThe {windowId} bidding window has closed.\n\n**Total Winning Bids:** {totalBids}\n**Total Coins Committed:** ${totalCoins}\n\nProcessing transactions now...',
        description: 'Message posted when FA bidding window closes',
        category: 'fa',
        variables: JSON.stringify(['windowId', 'totalBids', 'totalCoins']),
      });
    }

    console.log('[Config Loader] Default configurations initialized');
  } catch (error) {
    console.error('[Config Loader] Error initializing defaults:', error);
  }
}
