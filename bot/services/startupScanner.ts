/**
 * Startup Scanner Service
 * 
 * Scans for missed votes and bids when the bot starts up.
 * This ensures no trades or bids are missed during downtime.
 */

import { Client, TextChannel, Message } from 'discord.js';
import { logger } from './logger';
import { config } from '../config';
import { TradeVotingService } from './tradeVoting';

class StartupScannerClass {
  private client: Client | null = null;

  /**
   * Initialize and run startup scan
   */
  async initialize(client: Client): Promise<void> {
    this.client = client;
    
    logger.info('🔍 Starting startup scan for missed votes...');
    
    try {
      await this.scanTradeChannel();
      logger.info('✅ Startup scan complete');
    } catch (error) {
      logger.error('Startup scan failed:', error);
    }
  }

  /**
   * Scan trade channel for trades that may have reached threshold while bot was offline
   */
  private async scanTradeChannel(): Promise<void> {
    if (!this.client) return;

    try {
      const channel = await this.client.channels.fetch(config.channels.trades);
      if (!channel || !(channel instanceof TextChannel)) {
        logger.warn('Trade channel not found or not a text channel');
        return;
      }

      // Fetch recent messages (last 100)
      const messages = await channel.messages.fetch({ limit: 100 });
      
      let scannedCount = 0;
      let processedCount = 0;

      for (const [messageId, message] of messages) {
        // Skip messages before the filter
        if (BigInt(messageId) < BigInt(config.filters.minTradeMessageId)) {
          continue;
        }

        scannedCount++;

        // Check if this message has trade-like reactions
        const upvoteReaction = message.reactions.cache.find(r => r.emoji.name === config.emojis.upvote);
        const downvoteReaction = message.reactions.cache.find(r => r.emoji.name === config.emojis.downvote);

        if (!upvoteReaction && !downvoteReaction) {
          continue; // No votes, skip
        }

        const upvotes = upvoteReaction ? (upvoteReaction.count - (upvoteReaction.me ? 1 : 0)) : 0;
        const downvotes = downvoteReaction ? (downvoteReaction.count - (downvoteReaction.me ? 1 : 0)) : 0;

        // Check if thresholds are met but trade wasn't processed
        if (upvotes >= config.voting.approvalThreshold || downvotes >= config.voting.rejectionThreshold) {
          // Check if already has success/error reaction (already processed)
          const hasSuccessReaction = message.reactions.cache.some(r => r.emoji.name === config.emojis.success);
          const hasErrorReaction = message.reactions.cache.some(r => r.emoji.name === config.emojis.error);

          if (!hasSuccessReaction && !hasErrorReaction) {
            logger.info(`Found unprocessed trade ${messageId} with ${upvotes} 👍 / ${downvotes} 👎`);
            
            // Process the trade
            if (upvotes >= config.voting.approvalThreshold) {
              await this.processUnprocessedTrade(message, upvotes, downvotes, 'approve');
              processedCount++;
            } else if (downvotes >= config.voting.rejectionThreshold) {
              await this.processUnprocessedTrade(message, upvotes, downvotes, 'reject');
              processedCount++;
            }
          }
        }
      }

      logger.info(`Startup scan: Scanned ${scannedCount} messages, processed ${processedCount} trades`);

    } catch (error) {
      logger.error('Error scanning trade channel:', error);
    }
  }

  /**
   * Process a trade that was missed during downtime
   */
  private async processUnprocessedTrade(
    message: Message,
    upvotes: number,
    downvotes: number,
    action: 'approve' | 'reject'
  ): Promise<void> {
    try {
      if (action === 'approve') {
        logger.info(`Processing missed trade approval: ${message.id}`);
        // Create a mock reaction to trigger the approval flow
        const upvoteReaction = message.reactions.cache.find(r => r.emoji.name === config.emojis.upvote);
        if (upvoteReaction) {
          // Fetch users who reacted to get a real user
          const users = await upvoteReaction.users.fetch();
          const firstUser = users.first();
          if (firstUser) {
            await TradeVotingService.handleVote(upvoteReaction, firstUser, true);
          }
        }
      } else {
        logger.info(`Processing missed trade rejection: ${message.id}`);
        const downvoteReaction = message.reactions.cache.find(r => r.emoji.name === config.emojis.downvote);
        if (downvoteReaction) {
          const users = await downvoteReaction.users.fetch();
          const firstUser = users.first();
          if (firstUser) {
            await TradeVotingService.handleVote(downvoteReaction, firstUser, false);
          }
        }
      }
    } catch (error) {
      logger.error(`Error processing missed trade ${message.id}:`, error);
    }
  }
}

// Export singleton
export const StartupScanner = new StartupScannerClass();
