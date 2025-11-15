import { Client, Message, MessageReaction, User, PartialMessageReaction, PartialUser, EmbedBuilder } from 'discord.js';

const TRADE_CHANNEL_ID = '1087524540634116116';
const TRADE_COMMITTEE_ROLE = 'Trade Committee';
const APPROVAL_THRESHOLD = 7; // 👍 votes needed
const REJECTION_THRESHOLD = 5; // 👎 votes needed

interface VoteCount {
  upvotes: number;
  downvotes: number;
  voters: Set<string>; // Track who voted to prevent double voting
  messageId: string;
  processed: boolean;
}

// Track active votes
const activeVotes = new Map<string, VoteCount>();

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
 * Process vote result and post confirmation/rejection
 */
async function processVoteResult(
  message: Message,
  upvotes: number,
  downvotes: number,
  approved: boolean
) {
  try {
    const voteData = activeVotes.get(message.id);
    if (!voteData || voteData.processed) return;
    
    // Mark as processed
    voteData.processed = true;
    
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
    
  } catch (error) {
    console.error('[Trade Voting] Error processing vote result:', error);
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
      processed: false    });
    
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
    const voteData = activeVotes.get(reaction.message.id);
    if (!voteData || voteData.processed) return;
    
    // Check if user has Trade Committee role
    const hasRole = await hasTradeCommitteeRole(reaction, user.id);
    
    // Remove bot's placeholder reactions after first Trade Committee member votes
    if (hasRole) {
      const message = reaction.message;
      const botId = message.client.user?.id;
      
      if (botId) {
        // Remove bot's 👍 reaction
        const upReaction = message.reactions.cache.get('👍');
        if (upReaction) {
          try {
            await upReaction.users.remove(botId);
            console.log(`[Trade Voting] Removed bot's 👍 reaction`);
          } catch (error) {
            console.log(`[Trade Voting] Could not remove bot's 👍 reaction`);
          }
        }
        
        // Remove bot's 👎 reaction
        const downReaction = message.reactions.cache.get('👎');
        if (downReaction) {
          try {
            await downReaction.users.remove(botId);
            console.log(`[Trade Voting] Removed bot's 👎 reaction`);
          } catch (error) {
            console.log(`[Trade Voting] Could not remove bot's 👎 reaction`);
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
      
      console.log(`[Trade Voting] Rejected vote from ${user.tag} (no Trade Committee role)`);
      return;
    }
    
    // Count votes
    const { upvotes, downvotes } = await countVotes(reaction);
    
    console.log(`[Trade Voting] Current votes: ${upvotes} 👍, ${downvotes} 👎`);
    
    // Check if vote threshold reached
    // Approval: 7 👍 before reaching 5 👎
    // Rejection: 5 👎 before reaching 7 👍
    if (upvotes >= APPROVAL_THRESHOLD && downvotes < REJECTION_THRESHOLD) {
      // Trade approved: got 7 upvotes before hitting 5 downvotes
      await processVoteResult(reaction.message as Message, upvotes, downvotes, true);
    } else if (downvotes >= REJECTION_THRESHOLD && upvotes < APPROVAL_THRESHOLD) {
      // Trade rejected: got 5 downvotes before hitting 7 upvotes
      await processVoteResult(reaction.message as Message, upvotes, downvotes, false);
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
    const voteData = activeVotes.get(reaction.message.id);
    if (!voteData || voteData.processed) return;
    
    // Recount votes when someone removes their vote
    const { upvotes, downvotes } = await countVotes(reaction);
    console.log(`[Trade Voting] Vote removed. Current votes: ${upvotes} 👍, ${downvotes} 👎`);
    
  } catch (error) {
    console.error('[Trade Voting] Error handling reaction remove:', error);
  }
}

/**
 * Initialize trade voting system
 */
export function initializeTradeVoting(client: Client) {
  console.log('[Trade Voting] Trade voting system initialized');
  console.log(`[Trade Voting] Monitoring channel: ${TRADE_CHANNEL_ID}`);
  console.log(`[Trade Voting] Required role: ${TRADE_COMMITTEE_ROLE}`);
  console.log(`[Trade Voting] Approval threshold: ${APPROVAL_THRESHOLD} 👍`);
  console.log(`[Trade Voting] Rejection threshold: ${REJECTION_THRESHOLD} 👎`);
}
