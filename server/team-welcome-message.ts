/**
 * Team Welcome Message
 * Posts welcome message to team channels when users are assigned team roles
 */

import { Client, TextChannel, ChannelType } from 'discord.js';
import { getTemplate, replaceVariables } from './bot-config-loader.js';

const GUILD_ID = '860782751656837140';

/**
 * Get the welcome message content for a team
 * Now uses database template instead of hardcoded message
 */
async function getWelcomeMessage(teamName: string, userId: string, username: string): Promise<string> {
  // Try to load from database
  const template = await getTemplate('welcome_message');
  
  if (template) {
    // Replace variables in template
    return replaceVariables(template, {
      teamName,
      userId,
      username,
    });
  }
  
  // Fallback to hardcoded message if template not found
  return getDefaultWelcomeMessage(teamName, userId);
}

/**
 * Default welcome message (fallback)
 */
function getDefaultWelcomeMessage(teamName: string, userId: string): string {
  return `<@${userId}> **Welcome to ${teamName}!**

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
⏳ pending • ❓ need info • ✅ approved • ❌ denied • 📒 logged • 🎮 pushed in-game`;
}

/**
 * Get channel name from team name
 */
function getChannelName(teamName: string): string {
  return `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Post welcome message to team channel
 */
export async function postWelcomeMessage(
  client: Client,
  teamName: string,
  userId: string,
  username: string
): Promise<void> {
  try {
    // Ensure client is ready
    if (!client.isReady()) {
      console.warn('[Welcome Message] Client not ready, skipping');
      return;
    }

    // Get guild
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      console.error('[Welcome Message] Guild not found');
      return;
    }

    // Find team channel
    const channelName = getChannelName(teamName);
    const channel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === channelName
    ) as TextChannel | undefined;

    if (!channel) {
      console.warn(`[Welcome Message] Channel not found: ${channelName}`);
      return;
    }

    // Post welcome message
    const message = await getWelcomeMessage(teamName, userId, username);
    await channel.send(message);
    
    console.log(`[Welcome Message] ✅ Posted welcome to ${channelName} for ${username}`);
  } catch (error) {
    console.error('[Welcome Message] Error posting welcome message:', error);
  }
}
