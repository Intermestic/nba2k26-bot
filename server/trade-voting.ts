import { Client, Message, MessageReaction, User, PartialMessageReaction, PartialUser, EmbedBuilder, TextChannel, Collection } from 'discord.js';
import { getDb } from './db.js';
import { tradeVotes, trades } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const TRADE_CHANNEL_ID = '1087524540634116116';
const TRADE_COMMITTEE_ROLE = 'Trade Committee';
const APPROVAL_THRESHOLD = 7; // 👍 votes needed
const REJECTION_THRESHOLD = 5; // 👎 votes needed
const MIN_AUTO_TRACK_MESSAGE_ID = '1439096316801060964'; // Only auto-track trades after this message
const MIN_TRADE_MESSAGE_ID = '1440180026187321444'; // Only process trades after this message (prevents re-checking historical trades)

interface VoteCount {
  upvotes: number;
  downvotes: number;
  voters: Set<string>; // Track who voted to prevent double voting
  messageId: string;
  processed: boolean;
  createdAt: Date;
  lastReminderSent?: Date;
}

// Track active votes
const activeVotes = new Map<string, VoteCount>();

// Track which messages are currently being processed to prevent duplicate posting
const processingVotes = new Set<string>();

/**
 * Check if user has Trade Committee role
 */
async function hasTradeCommitteeRole(reaction: MessageReaction | PartialMessageReaction, userId: string): Promise<boolean> {
  try {
    const guild = reaction.message.guild;
    if (!guild) {
      console.log('[Trade Voting] No guild found');
      return false;
    }

    const member = await guild.members.fetch(userId);
    
    // Case-insensitive and whitespace-trimmed comparison
    const normalizedTargetRole = TRADE_COMMITTEE_ROLE.toLowerCase().trim();
    const hasRole = member.roles.cache.some(role => 
      role.name.toLowerCase().trim() === normalizedTargetRole
    );
    
    return hasRole;
  } catch (error) {
    console.error('[Trade Voting] Error checking role:', error);
    return false;
  }
}

/**
 * Count valid votes from Trade Committee members
 */
async function countVotes(reaction: MessageReaction | PartialMessageReaction): Promise<{ upvotes: number; downvotes: number }> {
  try {
    const message = reaction.message;
    
    // Fetch all reactions
    const upReaction = message.reactions.cache.get('👍');
    const downReaction = message.reactions.cache.get('👎');
    
    let upvotes = 0;
    let downvotes = 0;
    
    // Count upvotes from Trade Committee members
    if (upReaction) {
      const users = await upReaction.users.fetch();
      for (const [userId, user] of Array.from(users.entries())) {
        if (user.bot) continue; // Skip bot reactions
        if (await hasTradeCommitteeRole(upReaction, userId)) {
          upvotes++;
        }
      }
    }
    
    // Count downvotes from Trade Committee members
    if (downReaction) {
      const users = await downReaction.users.fetch();
      for (const [userId, user] of Array.from(users.entries())) {
        if (user.bot) continue; // Skip bot reactions
        if (await hasTradeCommitteeRole(downReaction, userId)) {
          downvotes++;
        }
      }
    }
    
    return { upvotes, downvotes };
  } catch (error) {
    console.error('[Trade Voting] Error counting votes:', error);
    return { upvotes: 0, downvotes: 0 };
  }
}

/**
 * Parse trade details from Discord embed message
 */
function parseTradeFromEmbed(message: Message): { team1: string; team2: string; team1Players: any[]; team2Players: any[] } | null {
  try {
    if (message.embeds.length === 0) return null;
    
    const embed = message.embeds[0];
    const description = embed.description;
    
    if (!description) return null;
    
    // Extract team names from the embed title or description
    // Expected format: "Team1 send:\n...\n\nTeam2 send:\n..."
    const teamPattern = /([A-Za-z\s]+)\s+send:/gi;
    const teamMatches = Array.from(description.matchAll(teamPattern));
    
    if (teamMatches.length < 2) {
      console.log('[Trade Parser] Could not find two teams in embed');
      return null;
    }
    
    const team1 = teamMatches[0][1].trim();
    const team2 = teamMatches[1][1].trim();
    
    // Extract player lists for each team
    // Split by team sections
    const sections = description.split(/[A-Za-z\s]+\s+send:/i);
    
    if (sections.length < 3) {
      console.log('[Trade Parser] Could not split embed into team sections');
      return null;
    }
    
    const team1Section = sections[1];
    const team2Section = sections[2];
    
    // Parse players from each section
    // Expected format: "Player Name OVR(salary)\n"
    const playerPattern = /([A-Za-z\s\.'-]+)\s+(\d+)\s*\((\d+)\)/g;
    
    const team1Players: any[] = [];
    let match;
    while ((match = playerPattern.exec(team1Section)) !== null) {
      team1Players.push({
        name: match[1].trim(),
        overall: parseInt(match[2]),
        salary: parseInt(match[3])
      });
    }
    
    const team2Players: any[] = [];
    playerPattern.lastIndex = 0; // Reset regex
    while ((match = playerPattern.exec(team2Section)) !== null) {
      team2Players.push({
        name: match[1].trim(),
        overall: parseInt(match[2]),
        salary: parseInt(match[3])
      });
    }
    
    console.log(`[Trade Parser] Parsed trade: ${team1} (${team1Players.length} players) ↔ ${team2} (${team2Players.length} players)`);
    
    return {
      team1,
      team2,
      team1Players,
      team2Players
    };
  } catch (error) {
    console.error('[Trade Parser] Error parsing trade from embed:', error);
    return null;
  }
}

/**
 * Process vote result and post confirmation/rejection
 */
async function processVoteResult(
  message: Message,
  upvotes: number,
  downvotes: number,
  approved: boolean
) {
  try {
    // Check if this message is already being processed (mutex lock)
    if (processingVotes.has(message.id)) {
      console.log(`[Trade Voting] Trade ${message.id} is already being processed, skipping duplicate call`);
      return;
    }
    
    // Add to processing set to prevent concurrent calls
    processingVotes.add(message.id);
    
    // Check if this trade vote has already been processed in the database
    const db = await getDb();
    if (!db) {
      console.error('[Trade Voting] Database not available, cannot check for duplicate votes');
      return;
    }
    
    const existingVote = await db.select().from(tradeVotes).where(eq(tradeVotes.messageId, message.id)).limit(1);
    if (existingVote.length > 0) {
      console.log(`[Trade Voting] Trade ${message.id} already processed at ${existingVote[0].processedAt}, skipping duplicate`);
      return;
    }
    
    const voteData = activeVotes.get(message.id);
    if (voteData) {
      // Mark as processed in memory
      voteData.processed = true;
    }
    
    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: `Vote completed with ${upvotes} 👍 and ${downvotes} 👎` });
    
    if (approved) {
      embed
        .setTitle('✅ Trade Approved')
        .setDescription(`This trade has been **approved** by the Trade Committee with ${upvotes} votes in favor.`)
        .setColor(0x00ff00); // Green
    } else {
      embed
        .setTitle('❌ Trade Rejected')
        .setDescription(`This trade has been **rejected** by the Trade Committee with ${downvotes} votes against.`)
        .setColor(0xff0000); // Red
    }
    
    await message.reply({ embeds: [embed] });
    console.log(`[Trade Voting] Trade ${approved ? 'approved' : 'rejected'}: ${upvotes} 👍, ${downvotes} 👎`);
    
    // Save to database to prevent duplicate processing
    if (db) {
      await db.insert(tradeVotes).values({
      messageId: message.id,
      upvotes,
      downvotes,
      approved: approved ? 1 : 0,
      });
      console.log(`[Trade Voting] Saved vote result to database for message ${message.id}`);
      
      // Parse trade details from embed and save to trades table
      try {
        const tradeDetails = parseTradeFromEmbed(message);
        if (tradeDetails) {
          await db.insert(trades).values({
            messageId: message.id,
            team1: tradeDetails.team1,
            team2: tradeDetails.team2,
            team1Players: JSON.stringify(tradeDetails.team1Players),
            team2Players: JSON.stringify(tradeDetails.team2Players),
            status: approved ? 'approved' : 'rejected',
            upvotes,
            downvotes,
            approvedBy: approved ? 'Discord Vote' : undefined,
            rejectedBy: approved ? undefined : 'Discord Vote',
            processedAt: new Date(),
          });
          console.log(`[Trade Voting] Saved trade details to trades table for message ${message.id}`);
        } else {
          console.log(`[Trade Voting] Could not parse trade details from embed for message ${message.id}`);
        }
      } catch (error) {
        console.error(`[Trade Voting] Error saving trade details:`, error);
      }
    }
    
    // Trigger Discord cap status auto-update when trade is approved
    if (approved) {
      try {
        const { autoUpdateDiscord } = await import('./discord.js');
        // We don't know exact teams from the message, so trigger without team list
        autoUpdateDiscord().catch(err => 
          console.error('[Trade Voting] Auto-update Discord failed:', err)
        );
      } catch (err) {
        console.error('[Trade Voting] Failed to trigger Discord auto-update:', err);
      }
    }
    
  } catch (error) {
    console.error('[Trade Voting] Error processing vote result:', error);
  } finally {
    // Always remove from processing set, even if error occurred
    processingVotes.delete(message.id);
  }
}

/**
 * Handle new trade embed posted to channel
 */
export async function handleNewTradeEmbed(message: Message) {
  try {
    // Only process messages in trade channel
    if (message.channelId !== TRADE_CHANNEL_ID) return;
    
    // Only process messages with embeds (trade posts)
    if (message.embeds.length === 0) return;
    
    // Skip messages from our own bot
    if (message.author.id === message.client.user?.id) return;
    
    console.log(`[Trade Voting] New trade embed detected from ${message.author.tag}, adding reactions...`);
    
    // Add voting reactions
    await message.react('👍');
    await message.react('👎');
    
    // Initialize vote tracking
    activeVotes.set(message.id, {
      upvotes: 0,
      downvotes: 0,
      voters: new Set(),
      messageId: message.id,
      processed: false,
      createdAt: new Date()
    });
    
    console.log(`[Trade Voting] Reactions added and vote tracking initialized`);

    
  } catch (error) {
    console.error('[Trade Voting] Error handling new trade embed:', error);
  }
}

/**
 * Handle reaction add event
 */
export async function handleReactionAdd(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  try {
    // Fetch partial data
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }
    
    // Skip bot reactions
    if (user.bot) return;
    
    // Only process reactions in trade channel
    if (reaction.message.channelId !== TRADE_CHANNEL_ID) return;
    
    // Only process 👍 and 👎 reactions
    if (reaction.emoji.name !== '👍' && reaction.emoji.name !== '👎') return;
    
    // Check if this is a tracked trade vote
    let voteData = activeVotes.get(reaction.message.id);
    
    // If not tracked yet, initialize tracking (handles bot restarts or missed messages)
    if (!voteData) {
      // Only initialize if message has embeds (is a trade post) AND is after minimum message ID
      if (reaction.message.embeds && reaction.message.embeds.length > 0) {
        // Check if message ID is after the minimum threshold
        if (BigInt(reaction.message.id) >= BigInt(MIN_AUTO_TRACK_MESSAGE_ID)) {
          console.log(`[Trade Voting] Auto-initializing vote tracking for message ${reaction.message.id}`);
          voteData = {
            upvotes: 0,
            downvotes: 0,
            voters: new Set(),
            messageId: reaction.message.id,
            processed: false,
            createdAt: new Date()
          };
          activeVotes.set(reaction.message.id, voteData);
        } else {
          console.log(`[Trade Voting] Skipping auto-initialization for old message ${reaction.message.id} (before ${MIN_AUTO_TRACK_MESSAGE_ID})`);
          return; // Old trade, don't auto-track
        }
      } else {
        return; // Not a trade post, ignore
      }
    }
    
    // Skip if already processed
    if (voteData.processed) return;
    
    // Check if user has Trade Committee role
    const hasRole = await hasTradeCommitteeRole(reaction, user.id);
    
    // Remove bot's placeholder reaction only for the specific reaction type voted on
    if (hasRole) {
      const message = reaction.message;
      const botId = message.client.user?.id;
      const emojiName = reaction.emoji.name;
      
      if (botId) {
        // Only remove bot's reaction if it matches the type being voted on
        if (emojiName === '👍') {
          const upReaction = message.reactions.cache.get('👍');
          if (upReaction) {
            try {
              await upReaction.users.remove(botId);
              console.log(`[Trade Voting] Removed bot's 👍 reaction after first 👍 vote`);
            } catch (error) {
              console.log(`[Trade Voting] Could not remove bot's 👍 reaction`);
            }
          }
        } else if (emojiName === '👎') {
          const downReaction = message.reactions.cache.get('👎');
          if (downReaction) {
            try {
              await downReaction.users.remove(botId);
              console.log(`[Trade Voting] Removed bot's 👎 reaction after first 👎 vote`);
            } catch (error) {
              console.log(`[Trade Voting] Could not remove bot's 👎 reaction`);
            }
          }
        }
      }
    }
    
    if (!hasRole) {
      // Remove invalid vote
      await reaction.users.remove(user.id);
      
      // Notify user their vote doesn't count
      try {
        await user.send(
          `❌ **Vote Not Counted**\n\n` +
          `Your vote on the trade in <#${TRADE_CHANNEL_ID}> was not counted because you don't have the **${TRADE_COMMITTEE_ROLE}** role.\n\n` +
          `Only Trade Committee members can vote on trades.`
        );
      } catch (dmError) {
        console.log(`[Trade Voting] Could not DM user ${user.tag} about invalid vote`);
      }
      
      console.log(`[Trade Voting] ⚠️  Rejected vote from ${user.tag} (ID: ${user.id}) - missing ${TRADE_COMMITTEE_ROLE} role`);
      console.log(`[Trade Voting] User's ${reaction.emoji.name} reaction was removed`);
      return;
    }
    
    // Add voter to tracking
    voteData.voters.add(user.id);
    
    // Count votes
    const { upvotes, downvotes } = await countVotes(reaction);
    
    console.log(`[Trade Voting] Current votes: ${upvotes} 👍, ${downvotes} 👎`);
    
    // Check if vote threshold reached
    // Rejection takes priority: if 5 👎 reached, reject immediately
    // Approval: 7 👍 (only if not already rejected)
    if (downvotes >= REJECTION_THRESHOLD || upvotes >= APPROVAL_THRESHOLD) {
      // Early lock check to prevent race condition
      if (processingVotes.has(reaction.message.id)) {
        console.log(`[Trade Voting] Trade ${reaction.message.id} is already being processed, skipping duplicate reaction event`);
        return;
      }
      
      // Check database to prevent duplicate processing
      const db = await getDb();
      if (db) {
        const existingVote = await db.select().from(tradeVotes).where(eq(tradeVotes.messageId, reaction.message.id)).limit(1);
        if (existingVote.length > 0) {
          console.log(`[Trade Voting] Trade ${reaction.message.id} already processed at ${existingVote[0].processedAt}, skipping duplicate reaction event`);
          return;
        }
      }
      
      // Process the vote result
      if (downvotes >= REJECTION_THRESHOLD) {
        // Trade rejected: got 5 downvotes
        await processVoteResult(reaction.message as Message, upvotes, downvotes, false);
      } else if (upvotes >= APPROVAL_THRESHOLD) {
        // Trade approved: got 7 upvotes (and less than 5 downvotes)
        await processVoteResult(reaction.message as Message, upvotes, downvotes, true);
      }
    }
    
  } catch (error) {
    console.error('[Trade Voting] Error handling reaction add:', error);
  }
}

/**
 * Handle reaction remove event
 */
export async function handleReactionRemove(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  try {
    // Fetch partial data
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }
    
    // Skip bot reactions
    if (user.bot) return;
    
    // Only process reactions in trade channel
    if (reaction.message.channelId !== TRADE_CHANNEL_ID) return;
    
    // Only process 👍 and 👎 reactions
    if (reaction.emoji.name !== '👍' && reaction.emoji.name !== '👎') return;
    
    // Check if this is a tracked trade vote
    let voteData = activeVotes.get(reaction.message.id);
    
    // If not tracked yet, initialize tracking (handles bot restarts or missed messages)
    if (!voteData) {
      // Only initialize if message has embeds (is a trade post) AND is after minimum message ID
      if (reaction.message.embeds && reaction.message.embeds.length > 0) {
        // Check if message ID is after the minimum threshold
        if (BigInt(reaction.message.id) >= BigInt(MIN_AUTO_TRACK_MESSAGE_ID)) {
          console.log(`[Trade Voting] Auto-initializing vote tracking for message ${reaction.message.id}`);
          voteData = {
            upvotes: 0,
            downvotes: 0,
            voters: new Set(),
            messageId: reaction.message.id,
            processed: false,
            createdAt: new Date()
          };
          activeVotes.set(reaction.message.id, voteData);
        } else {
          console.log(`[Trade Voting] Skipping auto-initialization for old message ${reaction.message.id} (before ${MIN_AUTO_TRACK_MESSAGE_ID})`);
          return; // Old trade, don't auto-track
        }
      } else {
        return; // Not a trade post, ignore
      }
    }
    
    // Skip if already processed
    if (voteData.processed) return;
    
    // Recount votes when someone removes their vote
    const { upvotes, downvotes } = await countVotes(reaction);
    console.log(`[Trade Voting] Vote removed. Current votes: ${upvotes} 👍, ${downvotes} 👎`);
    
  } catch (error) {
    console.error('[Trade Voting] Error handling reaction remove:', error);
  }
}

/**
 * Get all Trade Committee members in the guild
 */
async function getAllTradeCommitteeMembers(client: Client): Promise<Array<{ id: string; username: string }>> {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.log('[Trade Reminders] No guild found');
      return [];
    }
    
    await guild.members.fetch();
    
    const normalizedTargetRole = TRADE_COMMITTEE_ROLE.toLowerCase().trim();
    const committeeMembers: Array<{ id: string; username: string }> = [];
    
    for (const [memberId, member] of Array.from(guild.members.cache.entries())) {
      const hasRole = member.roles.cache.some(role => 
        role.name.toLowerCase().trim() === normalizedTargetRole
      );
      
      if (hasRole) {
        committeeMembers.push({
          id: memberId,
          username: member.user.username
        });
      }
    }
    
    return committeeMembers;
  } catch (error) {
    console.error('[Trade Reminders] Error fetching Trade Committee members:', error);
    return [];
  }
}

/**
 * Send reminders to Trade Committee members who haven't voted
 */
async function sendVoteReminders(client: Client) {
  try {
    const now = new Date();
    
    for (const [messageId, voteData] of Array.from(activeVotes.entries())) {
      // Skip processed trades
      if (voteData.processed) continue;
      
      // Check if at least 1 hour has passed since creation or last reminder
      const lastCheck = voteData.lastReminderSent || voteData.createdAt;
      const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCheck < 1) continue;
      
      // Get all Trade Committee members
      const allMembers = await getAllTradeCommitteeMembers(client);
      
      // Find members who haven't voted yet
      const nonVoters = allMembers.filter(member => !voteData.voters.has(member.id));
      
      if (nonVoters.length === 0) {
        console.log(`[Trade Reminders] All Trade Committee members have voted on trade ${messageId}`);
        continue;
      }
      
      // Fetch the trade message
      const channel = await client.channels.fetch(TRADE_CHANNEL_ID);
      if (!channel?.isTextBased()) continue;
      
      const message = await (channel as any).messages.fetch(messageId);
      if (!message) continue;
      
      // Get current vote counts
      const { upvotes, downvotes } = await countVotes({ message } as any);
      
      // Extract trade details from embed
      let tradeDetails = 'a pending trade';
      if (message.embeds.length > 0) {
        const embed = message.embeds[0];
        if (embed.title) {
          tradeDetails = embed.title;
        }
      }
      
      // Send DM to each non-voter
      for (const member of nonVoters) {
        try {
          const user = await client.users.fetch(member.id);
          await user.send(
            `⚠️ **Trade Vote Reminder**\n\n` +
            `You have not yet voted on ${tradeDetails}.\n\n` +
            `**Current Status:**\n` +
            `• 👍 Approve: ${upvotes}/${APPROVAL_THRESHOLD}\n` +
            `• 👎 Reject: ${downvotes}/${REJECTION_THRESHOLD}\n\n` +
            `**Vote here:** https://discord.com/channels/${message.guildId}/${TRADE_CHANNEL_ID}/${messageId}\n\n` +
            `_This is an hourly reminder for all unvoted trades._`
          );
          console.log(`[Trade Reminders] Sent reminder to ${member.username} for trade ${messageId}`);
        } catch (dmError) {
          console.log(`[Trade Reminders] Could not DM ${member.username}`);
        }
      }
      
      // Update last reminder time
      voteData.lastReminderSent = now;
      console.log(`[Trade Reminders] Sent ${nonVoters.length} reminders for trade ${messageId}`);
    }
  } catch (error) {
    console.error('[Trade Reminders] Error sending reminders:', error);
  }
}

/**
 * Manually check and process votes for a specific message
 * Used for retroactive vote counting when bot was offline
 */
export async function manuallyCheckTradeVotes(client: Client, messageId: string): Promise<{ success: boolean; message: string; upvotes?: number; downvotes?: number }> {
  try {
    console.log(`[Trade Voting] Manual check requested for message ${messageId}`);
    
    // Get the trade channel
    const channel = await client.channels.fetch(TRADE_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return { success: false, message: 'Trade channel not found or not text-based' };
    }
    
    // Fetch the message
    const message = await (channel as any).messages.fetch(messageId);
    if (!message) {
      return { success: false, message: 'Message not found' };
    }
    
    // Check if message has embeds (is a trade post)
    if (message.embeds.length === 0) {
      return { success: false, message: 'Message is not a trade post (no embeds)' };
    }
    
    // Check if message is after the minimum threshold (prevent re-checking historical trades)
    if (BigInt(messageId) < BigInt(MIN_TRADE_MESSAGE_ID)) {
      return { success: false, message: `Message is before minimum threshold (${MIN_TRADE_MESSAGE_ID}). Only processing trades after this ID.` };
    }
    
    // Check if already processed
    const voteData = activeVotes.get(messageId);
    if (voteData && voteData.processed) {
      return { success: false, message: 'Trade already processed' };
    }
    
    // Initialize vote tracking if not exists
    if (!voteData) {
      activeVotes.set(messageId, {
        upvotes: 0,
        downvotes: 0,
        voters: new Set(),
        messageId: messageId,
        processed: false,
        createdAt: new Date()
      });
    }
    
    // Count current votes
    const upReaction = message.reactions.cache.get('👍');
    const downReaction = message.reactions.cache.get('👎');
    
    let upvotes = 0;
    let downvotes = 0;
    
    // Count upvotes from Trade Committee members
    if (upReaction) {
      const users = await upReaction.users.fetch();
      for (const [userId, user] of users) {
        if (user.bot) continue;
        if (await hasTradeCommitteeRole(upReaction, userId)) {
          upvotes++;
        }
      }
    }
    
    // Count downvotes from Trade Committee members
    if (downReaction) {
      const users = await downReaction.users.fetch();
      for (const [userId, user] of users) {
        if (user.bot) continue;
        if (await hasTradeCommitteeRole(downReaction, userId)) {
          downvotes++;
        }
      }
    }
    
    console.log(`[Trade Voting] Manual check results: ${upvotes} 👍, ${downvotes} 👎`);
    
    // Check if threshold reached
    if (downvotes >= REJECTION_THRESHOLD) {
      await processVoteResult(message, upvotes, downvotes, false);
      return { success: true, message: `Trade rejected with ${downvotes} downvotes`, upvotes, downvotes };
    } else if (upvotes >= APPROVAL_THRESHOLD) {
      await processVoteResult(message, upvotes, downvotes, true);
      return { success: true, message: `Trade approved with ${upvotes} upvotes`, upvotes, downvotes };
    } else {
      return { success: true, message: `Vote in progress: ${upvotes} 👍, ${downvotes} 👎 (need ${APPROVAL_THRESHOLD} 👍 or ${REJECTION_THRESHOLD} 👎)`, upvotes, downvotes };
    }
    
  } catch (error) {
    console.error('[Trade Voting] Error in manual check:', error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Scan all trades starting from MIN_AUTO_TRACK_MESSAGE_ID for missed votes
 * Called on bot startup to catch any trades that reached thresholds while bot was offline
 */
export async function scanTradesForMissedVotes(client: Client) {
  try {
    console.log('[Trade Voting] 🔍 Scanning for missed votes on startup...');
    console.log(`[Trade Voting] Starting from message ID: ${MIN_TRADE_MESSAGE_ID}`);
    
    const channel = await client.channels.fetch(TRADE_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.log('[Trade Voting] ❌ Trade channel not found or not text-based');
      return;
    }
    
    const textChannel = channel as TextChannel;
    
    // Fetch messages starting from MIN_AUTO_TRACK_MESSAGE_ID
    let messagesChecked = 0;
    let tradesProcessed = 0;
    let lastMessageId: string | undefined = undefined;
    
    // Fetch messages in batches of 100 (Discord limit)
    while (true) {
      const options: any = { limit: 100 };
      if (lastMessageId) {
        options.before = lastMessageId;
      }
      
      const fetchedMessages = await textChannel.messages.fetch(options);
      
      // Handle both single message and collection returns
      let messages: Collection<string, Message>;
      if (fetchedMessages instanceof Collection) {
        messages = fetchedMessages;
      } else {
        // Single message returned, wrap in collection
        messages = new Collection();
        messages.set(fetchedMessages.id, fetchedMessages);
      }
      
      if (messages.size === 0) break;
      
      // Process each message
      for (const [messageId, message] of Array.from(messages.entries())) {
        // Stop if we've gone past the minimum message ID
        if (BigInt(messageId) < BigInt(MIN_TRADE_MESSAGE_ID)) {
          console.log(`[Trade Voting] ✅ Reached minimum message ID, stopping scan`);
          console.log(`[Trade Voting] 📊 Scan complete: ${messagesChecked} messages checked, ${tradesProcessed} trades processed`);
          return;
        }
        
        messagesChecked++;
        
        // Check if this is a trade post (has embeds and is from a bot)
        if (message.embeds.length > 0 && message.author.bot) {
          console.log(`[Trade Voting] 🔍 Found trade message ${messageId}, checking votes...`);
          
          // Use the manual check function to process this trade
          const result = await manuallyCheckTradeVotes(client, messageId);
          
          if (result.success) {
            tradesProcessed++;
            console.log(`[Trade Voting] ✅ ${result.message}`);
          } else {
            console.log(`[Trade Voting] ⚠️  ${result.message}`);
          }
        }
      }
      
      // Update lastMessageId for next batch
      const messagesArray = Array.from(messages.values());
      lastMessageId = messagesArray[messagesArray.length - 1]?.id;
      
      // If we fetched less than 100 messages, we've reached the end
      if (messages.size < 100) break;
    }
    
    console.log(`[Trade Voting] 📊 Scan complete: ${messagesChecked} messages checked, ${tradesProcessed} trades processed`);
    
  } catch (error) {
    console.error('[Trade Voting] ❌ Error scanning for missed votes:', error);
  }
}

/**
 * Initialize trade voting system
 */
export function initializeTradeVoting(client: Client) {
  console.log('[Trade Voting] Trade voting system initialized');
  console.log(`[Trade Voting] Monitoring channel: ${TRADE_CHANNEL_ID}`);
  console.log(`[Trade Voting] Required role: ${TRADE_COMMITTEE_ROLE}`);
  
  // Start reminder scheduler - send reminders every hour
  setInterval(() => {
    sendVoteReminders(client);
  }, 60 * 60 * 1000); // Every hour
  
  console.log('[Trade Reminders] Hourly vote reminders scheduled');
  
  // Scan for missed votes on startup
  scanTradesForMissedVotes(client).catch(error => {
    console.error('[Trade Voting] Error during startup scan:', error);
  });
}
