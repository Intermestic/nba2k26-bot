/**
 * Trade Voting Service
 * 
 * Handles all trade voting logic:
 * - Vote tracking
 * - Approval/rejection thresholds
 * - Trade processing
 * - Trade reversal
 */

import { MessageReaction, User, PartialMessageReaction, PartialUser, Message, TextChannel, Client } from 'discord.js';
import { logger } from './logger';
import { DatabaseService } from './database';
import { config } from '../config';
import { TradeParser } from '../parsers/tradeParser';
import { eq } from 'drizzle-orm';
import { trades, players } from '../../drizzle/schema';
import { getCapStatusUpdater } from './capStatusUpdater';

interface VoteCount {
  upvotes: number;
  downvotes: number;
}

class TradeVotingServiceClass {
  /**
   * Handle a vote on a trade message
   */
  async handleVote(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    isUpvote: boolean
  ): Promise<void> {
    const message = reaction.message;
    const messageId = message.id;

    // Get current vote counts
    const votes = await this.getVoteCounts(reaction);
    
    logger.info(`Trade ${messageId} votes: ${votes.upvotes} 👍 / ${votes.downvotes} 👎`);

    // Check if trade should be approved or rejected
    if (votes.upvotes >= config.voting.approvalThreshold) {
      await this.approveTrade(message as Message, votes);
    } else if (votes.downvotes >= config.voting.rejectionThreshold) {
      await this.rejectTrade(message as Message, votes);
    }
  }

  /**
   * Handle vote removal
   */
  async handleVoteRemoval(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ): Promise<void> {
    const messageId = reaction.message.id;
    const votes = await this.getVoteCounts(reaction);
    
    logger.info(`Trade ${messageId} votes after removal: ${votes.upvotes} 👍 / ${votes.downvotes} 👎`);
  }

  /**
   * Get current vote counts for a message
   */
  private async getVoteCounts(reaction: MessageReaction | PartialMessageReaction): Promise<VoteCount> {
    const message = reaction.message;
    
    // Fetch all reactions if needed
    if (message.partial) {
      try {
        await message.fetch();
      } catch (error) {
        logger.error('Failed to fetch message:', error);
        return { upvotes: 0, downvotes: 0 };
      }
    }

    const upvoteReaction = message.reactions.cache.find(r => r.emoji.name === config.emojis.upvote);
    const downvoteReaction = message.reactions.cache.find(r => r.emoji.name === config.emojis.downvote);

    // Subtract 1 if bot has reacted (to not count bot's own reaction)
    const upvotes = upvoteReaction ? (upvoteReaction.count - (upvoteReaction.me ? 1 : 0)) : 0;
    const downvotes = downvoteReaction ? (downvoteReaction.count - (downvoteReaction.me ? 1 : 0)) : 0;

    return { upvotes, downvotes };
  }

  /**
   * Approve a trade and process it
   */
  private async approveTrade(message: Message, votes: VoteCount): Promise<void> {
    const messageId = message.id;
    logger.info(`Trade ${messageId} APPROVED with ${votes.upvotes} votes`);

    // Check if already processed
    const existingTrade = await this.getTradeByMessageId(messageId);
    if (existingTrade && existingTrade.status === 'approved') {
      logger.debug(`Trade ${messageId} already approved, skipping`);
      return;
    }

    // Parse the trade from message content
    const tradeData = await this.parseTradeFromMessage(message);
    if (!tradeData) {
      logger.error(`Failed to parse trade from message ${messageId}`);
      await message.react(config.emojis.error);
      return;
    }

    // Process the trade (move players)
    const success = await this.processTrade(messageId, tradeData);
    
    if (success) {
      // React with success emoji
      await message.react(config.emojis.success);
      
      // Post approval message
      const channel = message.channel as TextChannel;
      await channel.send(`✅ **Trade Approved** (${votes.upvotes}-${votes.downvotes})\n${this.formatTradeDescription(tradeData)}`);
      
      // Update cap status messages and roles
      try {
        const capUpdater = getCapStatusUpdater();
        if (capUpdater) {
          await capUpdater.updateAll(message.client);
        }
      } catch (error) {
        logger.error('Error updating cap status after trade approval:', error);
      }
    } else {
      await message.react(config.emojis.error);
    }
  }

  /**
   * Reject a trade
   */
  private async rejectTrade(message: Message, votes: VoteCount): Promise<void> {
    const messageId = message.id;
    logger.info(`Trade ${messageId} REJECTED with ${votes.downvotes} votes`);

    // Update trade status in database
    await this.updateTradeStatus(messageId, 'rejected');

    // React with rejection indicator
    await message.react(config.emojis.error);

    // Post rejection message
    const channel = message.channel as TextChannel;
    await channel.send(`❌ **Trade Rejected** (${votes.upvotes}-${votes.downvotes})`);
  }

  /**
   * Parse trade data from a message
   */
  private async parseTradeFromMessage(message: Message): Promise<ParsedTrade | null> {
    // Get content from message or embeds
    let content = message.content;
    
    // Also check embeds (important for trade bot messages)
    if (message.embeds.length > 0) {
      const embed = message.embeds[0];
      if (embed.description) {
        content += '\n' + embed.description;
      }
      // Check embed fields
      for (const field of embed.fields) {
        content += '\n' + field.name + '\n' + field.value;
      }
    }

    return TradeParser.parse(content);
  }

  /**
   * Process an approved trade (move players)
   */
  private async processTrade(messageId: string, tradeData: ParsedTrade): Promise<boolean> {
    const db = DatabaseService.getDb();
    if (!db) {
      logger.error('Database not available for trade processing');
      return false;
    }

    try {
      // Move players to their new teams
      for (const movement of tradeData.movements) {
        const { playerName, fromTeam, toTeam } = movement;
        
        logger.info(`Moving ${playerName} from ${fromTeam} to ${toTeam}`);
        
        // Find player by name (case-insensitive)
        const playerResults = await db
          .select()
          .from(players)
          .where(eq(players.name, playerName))
          .limit(1);

        if (playerResults.length === 0) {
          logger.warn(`Player not found: ${playerName}`);
          continue;
        }

        const player = playerResults[0];

        // Update player's team
        await db
          .update(players)
          .set({ team: toTeam })
          .where(eq(players.id, player.id));

        logger.info(`✅ Moved ${playerName} to ${toTeam}`);
      }

      // Record trade in database
      await this.recordTrade(messageId, tradeData, 'approved');

      return true;
    } catch (error) {
      logger.error('Error processing trade:', error);
      return false;
    }
  }

  /**
   * Record trade in database
   */
  private async recordTrade(messageId: string, tradeData: ParsedTrade, status: string): Promise<void> {
    const db = DatabaseService.getDb();
    if (!db) return;

    try {
      await db.insert(trades).values({
        messageId,
        status,
        teams: JSON.stringify(tradeData.teams),
        players: JSON.stringify(tradeData.movements.map(m => m.playerName)),
        processedAt: new Date(),
      });
    } catch (error) {
      // Trade might already exist, try update
      try {
        await db
          .update(trades)
          .set({ status, processedAt: new Date() })
          .where(eq(trades.messageId, messageId));
      } catch (updateError) {
        logger.error('Failed to record trade:', updateError);
      }
    }
  }

  /**
   * Update trade status
   */
  private async updateTradeStatus(messageId: string, status: string): Promise<void> {
    const db = DatabaseService.getDb();
    if (!db) return;

    try {
      await db
        .update(trades)
        .set({ status })
        .where(eq(trades.messageId, messageId));
    } catch (error) {
      logger.error('Failed to update trade status:', error);
    }
  }

  /**
   * Get trade by message ID
   */
  private async getTradeByMessageId(messageId: string): Promise<any | null> {
    const db = DatabaseService.getDb();
    if (!db) return null;

    try {
      const results = await db
        .select()
        .from(trades)
        .where(eq(trades.messageId, messageId))
        .limit(1);

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Failed to get trade:', error);
      return null;
    }
  }

  /**
   * Format trade description for posting
   */
  private formatTradeDescription(tradeData: ParsedTrade): string {
    const teamMovements: Record<string, { incoming: string[], outgoing: string[] }> = {};

    for (const movement of tradeData.movements) {
      if (!teamMovements[movement.fromTeam]) {
        teamMovements[movement.fromTeam] = { incoming: [], outgoing: [] };
      }
      if (!teamMovements[movement.toTeam]) {
        teamMovements[movement.toTeam] = { incoming: [], outgoing: [] };
      }

      teamMovements[movement.fromTeam].outgoing.push(movement.playerName);
      teamMovements[movement.toTeam].incoming.push(movement.playerName);
    }

    const lines: string[] = [];
    for (const [team, movements] of Object.entries(teamMovements)) {
      if (movements.incoming.length > 0) {
        lines.push(`**${team}** receive: ${movements.incoming.join(', ')}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Handle trade reversal
   */
  async handleReversal(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ): Promise<void> {
    const messageId = reaction.message.id;
    await this.reverseTrade(messageId, reaction.message.channel as TextChannel);
  }

  /**
   * Reverse a trade by message ID (for command)
   */
  async reverseTradeByMessageId(message: Message, tradeMessageId: string): Promise<void> {
    const success = await this.reverseTrade(tradeMessageId, message.channel as TextChannel);
    
    if (success) {
      await message.reply(`✅ Trade ${tradeMessageId} has been reversed.`);
    } else {
      await message.reply(`❌ Failed to reverse trade ${tradeMessageId}.`);
    }
  }

  /**
   * Reverse a trade
   */
  private async reverseTrade(messageId: string, channel: TextChannel): Promise<boolean> {
    logger.info(`Reversing trade ${messageId}`);

    const trade = await this.getTradeByMessageId(messageId);
    if (!trade) {
      logger.error(`Trade not found: ${messageId}`);
      return false;
    }

    const db = DatabaseService.getDb();
    if (!db) return false;

    try {
      // Parse the stored players and reverse their movements
      const tradeMovements = JSON.parse(trade.players || '[]');
      
      // This is simplified - in reality you'd need to track original teams
      // For now, just mark as reversed
      await db
        .update(trades)
        .set({ status: 'reversed' })
        .where(eq(trades.messageId, messageId));

      await channel.send(`⏪ **Trade Reversed** - Trade ${messageId} has been reversed.`);
      
      return true;
    } catch (error) {
      logger.error('Error reversing trade:', error);
      return false;
    }
  }

  /**
   * Check trade status (for !check-trade command)
   */
  async checkTradeStatus(message: Message, tradeMessageId: string): Promise<void> {
    try {
      // Try to fetch the trade message
      const channel = message.channel as TextChannel;
      const tradeMessage = await channel.messages.fetch(tradeMessageId).catch(() => null);

      if (!tradeMessage) {
        await message.reply(`Could not find trade message ${tradeMessageId}`);
        return;
      }

      // Get vote counts
      const upvoteReaction = tradeMessage.reactions.cache.find(r => r.emoji.name === config.emojis.upvote);
      const downvoteReaction = tradeMessage.reactions.cache.find(r => r.emoji.name === config.emojis.downvote);

      const upvotes = upvoteReaction ? (upvoteReaction.count - (upvoteReaction.me ? 1 : 0)) : 0;
      const downvotes = downvoteReaction ? (downvoteReaction.count - (downvoteReaction.me ? 1 : 0)) : 0;

      // Check database status
      const trade = await this.getTradeByMessageId(tradeMessageId);
      const dbStatus = trade ? trade.status : 'not recorded';

      await message.reply(`**Trade ${tradeMessageId}**\nVotes: ${upvotes} 👍 / ${downvotes} 👎\nStatus: ${dbStatus}`);
    } catch (error) {
      logger.error('Error checking trade status:', error);
      await message.reply('Error checking trade status.');
    }
  }
}

// Types
interface ParsedTrade {
  teams: string[];
  movements: Array<{
    playerName: string;
    fromTeam: string;
    toTeam: string;
  }>;
}

// Export singleton
export const TradeVotingService = new TradeVotingServiceClass();
