/**
 * Reaction Remove Handler
 * 
 * Handles reaction removal events (vote changes)
 */

import { MessageReaction, User, PartialMessageReaction, PartialUser } from 'discord.js';
import { logger } from '../services/logger';
import { config } from '../config';
import { TradeVotingService } from '../services/tradeVoting';

/**
 * Handle reaction remove event
 */
export async function handleReactionRemove(
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

  const emoji = reaction.emoji.name;
  const channelId = reaction.message.channelId;
  const messageId = reaction.message.id;

  logger.debug(`Reaction removed: ${emoji} by user on message ${messageId}`);

  // Only handle trade channel vote removals
  if (channelId === config.channels.trades) {
    if (emoji === config.emojis.upvote || emoji === config.emojis.downvote) {
      // Check message ID filter
      if (BigInt(messageId) < BigInt(config.filters.minTradeMessageId)) {
        return;
      }

      logger.info(`Trade vote removed: ${emoji} on ${messageId}`);
      await TradeVotingService.handleVoteRemoval(reaction, user);
    }
  }
}
