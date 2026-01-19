/**
 * Reaction Add Handler
 * 
 * Handles all reaction add events:
 * - Trade voting (👍/👎)
 * - FA bid confirmation (❗)
 * - FA bid processing (⚡)
 * - Trade reversal (⏪)
 */

import { MessageReaction, User, PartialMessageReaction, PartialUser, TextChannel } from 'discord.js';
import { logger } from '../services/logger';
import { config } from '../config';
import { TradeVotingService } from '../services/tradeVoting';
import { FABidService } from '../services/faBidding';

/**
 * Handle reaction add event
 */
export async function handleReactionAdd(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
): Promise<void> {
  // Ignore bot reactions
  if (user.bot) return;

  // Fetch partial data if needed
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      logger.error('Failed to fetch reaction:', error);
      return;
    }
  }

  if (user.partial) {
    try {
      await user.fetch();
    } catch (error) {
      logger.error('Failed to fetch user:', error);
      return;
    }
  }

  const emoji = reaction.emoji.name;
  const channelId = reaction.message.channelId;
  const messageId = reaction.message.id;

  logger.debug(`Reaction added: ${emoji} by ${user.username} on message ${messageId}`);

  // Route to appropriate handler based on channel and emoji
  if (channelId === config.channels.trades) {
    await handleTradeChannelReaction(reaction, user, emoji);
  } else if (channelId === config.channels.freeAgency) {
    await handleFAChannelReaction(reaction, user, emoji);
  }
}

/**
 * Handle reactions in the trade channel
 */
async function handleTradeChannelReaction(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  emoji: string | null
): Promise<void> {
  const messageId = reaction.message.id;

  // Check message ID filter
  if (BigInt(messageId) < BigInt(config.filters.minTradeMessageId)) {
    logger.debug(`Ignoring old trade message: ${messageId}`);
    return;
  }

  switch (emoji) {
    case config.emojis.upvote:
    case config.emojis.downvote:
      // Handle trade voting
      logger.info(`Trade vote: ${emoji} on ${messageId} by ${user.username}`);
      await TradeVotingService.handleVote(reaction, user, emoji === config.emojis.upvote);
      break;

    case config.emojis.tradeReverse:
      // Handle trade reversal (admin only)
      if (user.id === config.adminUserId) {
        logger.info(`Trade reversal requested on ${messageId} by ${user.username}`);
        await TradeVotingService.handleReversal(reaction, user);
      } else {
        logger.warn(`Unauthorized trade reversal attempt by ${user.username}`);
      }
      break;

    default:
      // Ignore other emojis
      break;
  }
}

/**
 * Handle reactions in the FA channel
 */
async function handleFAChannelReaction(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  emoji: string | null
): Promise<void> {
  const messageId = reaction.message.id;

  // FA bid processing is admin-gated
  if (user.id !== config.adminUserId) {
    if (emoji === config.emojis.bidConfirm || emoji === config.emojis.bidProcess) {
      logger.debug(`Non-admin FA reaction ignored: ${emoji} by ${user.username}`);
      return;
    }
  }

  switch (emoji) {
    case config.emojis.bidConfirm:
      // Admin confirms bid is counted (❗)
      logger.info(`FA bid confirmation on ${messageId} by admin`);
      await FABidService.handleBidConfirmation(reaction, user);
      break;

    case config.emojis.bidProcess:
      // Admin processes winning bid (⚡)
      logger.info(`FA bid processing on ${messageId} by admin`);
      await FABidService.handleBidProcessing(reaction, user);
      break;

    default:
      // Ignore other emojis
      break;
  }
}
