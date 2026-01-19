/**
 * FA Bidding Service
 * 
 * Handles Free Agency bidding:
 * - Bid detection from messages
 * - Bid confirmation (❗ emoji by admin)
 * - Winning bid processing (⚡ emoji by admin)
 */

import { MessageReaction, User, PartialMessageReaction, PartialUser, Message, TextChannel } from 'discord.js';
import { logger } from './logger';
import { DatabaseService } from './database';
import { config } from '../config';
import { FABidParser } from '../parsers/faBidParser';
import { PlayerMatcher } from '../parsers/playerMatcher';
import { eq, and } from 'drizzle-orm';
import { players, faBids, teamCoins } from '../../drizzle/schema';
import { getCapStatusUpdater } from './capStatusUpdater';

interface ParsedBid {
  playerToCut: string | null;
  playerToSign: string | null;
  bidAmount: number;
  teamName: string | null;
}

class FABidServiceClass {
  /**
   * Detect a potential bid from a message
   */
  async detectBid(message: Message): Promise<void> {
    const content = message.content;
    
    // Parse the bid
    const bidData = FABidParser.parse(content);
    
    if (!bidData) {
      logger.debug('Message did not match bid pattern');
      return;
    }

    logger.info(`Detected bid from ${message.author.username}:`, bidData);

    // Try to resolve player names
    if (bidData.playerToSign) {
      const matchedPlayer = await PlayerMatcher.findPlayer(bidData.playerToSign);
      if (matchedPlayer) {
        logger.info(`Matched player to sign: ${bidData.playerToSign} → ${matchedPlayer.name}`);
        bidData.playerToSign = matchedPlayer.name;
      }
    }

    if (bidData.playerToCut) {
      const matchedPlayer = await PlayerMatcher.findPlayer(bidData.playerToCut);
      if (matchedPlayer) {
        logger.info(`Matched player to cut: ${bidData.playerToCut} → ${matchedPlayer.name}`);
        bidData.playerToCut = matchedPlayer.name;
      }
    }

    // Store bid in database (pending confirmation)
    await this.storeBid(message, bidData);
  }

  /**
   * Store a bid in the database
   */
  private async storeBid(message: Message, bidData: ParsedBid): Promise<void> {
    const db = DatabaseService.getDb();
    if (!db) {
      logger.warn('Database not available, bid not stored');
      return;
    }

    try {
      await db.insert(faBids).values({
        messageId: message.id,
        discordUserId: message.author.id,
        discordUsername: message.author.username,
        playerToSign: bidData.playerToSign,
        playerToCut: bidData.playerToCut,
        bidAmount: bidData.bidAmount,
        status: 'pending',
        createdAt: new Date(),
      });

      logger.info(`Bid stored: ${message.id}`);
    } catch (error) {
      logger.error('Failed to store bid:', error);
    }
  }

  /**
   * Handle bid confirmation (❗ emoji by admin)
   */
  async handleBidConfirmation(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ): Promise<void> {
    const message = reaction.message;
    const messageId = message.id;

    logger.info(`Admin confirming bid on message ${messageId}`);

    // Fetch full message if partial
    if (message.partial) {
      try {
        await message.fetch();
      } catch (error) {
        logger.error('Failed to fetch message:', error);
        return;
      }
    }

    // Parse bid from message
    const bidData = FABidParser.parse(message.content);
    if (!bidData) {
      logger.warn('Could not parse bid from message');
      await (message as Message).react(config.emojis.error);
      return;
    }

    // Resolve player names
    if (bidData.playerToSign) {
      const matchedPlayer = await PlayerMatcher.findPlayer(bidData.playerToSign);
      if (matchedPlayer) {
        bidData.playerToSign = matchedPlayer.name;
      }
    }

    // Update bid status to confirmed
    const db = DatabaseService.getDb();
    if (db) {
      try {
        // Check if bid exists
        const existingBid = await db
          .select()
          .from(faBids)
          .where(eq(faBids.messageId, messageId))
          .limit(1);

        if (existingBid.length > 0) {
          await db
            .update(faBids)
            .set({ status: 'confirmed', confirmedAt: new Date() })
            .where(eq(faBids.messageId, messageId));
        } else {
          // Create new bid record
          await db.insert(faBids).values({
            messageId,
            discordUserId: (message as Message).author?.id || 'unknown',
            discordUsername: (message as Message).author?.username || 'unknown',
            playerToSign: bidData.playerToSign,
            playerToCut: bidData.playerToCut,
            bidAmount: bidData.bidAmount,
            status: 'confirmed',
            confirmedAt: new Date(),
            createdAt: new Date(),
          });
        }

        logger.info(`Bid ${messageId} confirmed`);
        await (message as Message).react(config.emojis.success);

        // Post confirmation message
        const channel = message.channel as TextChannel;
        await channel.send(`✅ **Bid Confirmed**: ${bidData.playerToSign || 'Unknown'} - ${bidData.bidAmount} coins`);
      } catch (error) {
        logger.error('Failed to confirm bid:', error);
        await (message as Message).react(config.emojis.error);
      }
    }
  }

  /**
   * Handle winning bid processing (⚡ emoji by admin)
   */
  async handleBidProcessing(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ): Promise<void> {
    const message = reaction.message;
    const messageId = message.id;

    logger.info(`Admin processing winning bid on message ${messageId}`);

    // Fetch full message if partial
    if (message.partial) {
      try {
        await message.fetch();
      } catch (error) {
        logger.error('Failed to fetch message:', error);
        return;
      }
    }

    // Get bid from database
    const db = DatabaseService.getDb();
    if (!db) {
      logger.error('Database not available');
      await (message as Message).react(config.emojis.error);
      return;
    }

    try {
      const bidResults = await db
        .select()
        .from(faBids)
        .where(eq(faBids.messageId, messageId))
        .limit(1);

      let bidData: ParsedBid;

      if (bidResults.length > 0) {
        const bid = bidResults[0];
        bidData = {
          playerToSign: bid.playerToSign,
          playerToCut: bid.playerToCut,
          bidAmount: bid.bidAmount || 0,
          teamName: null,
        };
      } else {
        // Parse from message if not in database
        const parsed = FABidParser.parse(message.content);
        if (!parsed) {
          logger.error('Could not parse bid from message');
          await (message as Message).react(config.emojis.error);
          return;
        }
        bidData = parsed;
      }

      // Process the winning bid
      const success = await this.processWinningBid(message as Message, bidData);

      if (success) {
        // Update bid status
        await db
          .update(faBids)
          .set({ status: 'processed', processedAt: new Date() })
          .where(eq(faBids.messageId, messageId));

        await (message as Message).react(config.emojis.success);
        
        // Update cap status messages and roles
        try {
          const capUpdater = getCapStatusUpdater();
          if (capUpdater) {
            await capUpdater.updateAll(message.client);
          }
        } catch (error) {
          logger.error('Error updating cap status after FA bid processing:', error);
        }
      } else {
        await (message as Message).react(config.emojis.error);
      }
    } catch (error) {
      logger.error('Failed to process bid:', error);
      await (message as Message).react(config.emojis.error);
    }
  }

  /**
   * Process a winning bid (sign player, cut player, deduct coins)
   */
  private async processWinningBid(message: Message, bidData: ParsedBid): Promise<boolean> {
    const db = DatabaseService.getDb();
    if (!db) return false;

    const channel = message.channel as TextChannel;

    try {
      // Get team from Discord user (you'd need to map Discord users to teams)
      // For now, we'll try to detect from message content or user roles
      const teamName = await this.getTeamFromMessage(message);

      if (!teamName) {
        await channel.send(`❌ Could not determine team for this bid. Please specify team.`);
        return false;
      }

      // Sign the player
      if (bidData.playerToSign) {
        const matchedPlayer = await PlayerMatcher.findPlayer(bidData.playerToSign);
        if (matchedPlayer) {
          await db
            .update(players)
            .set({ team: teamName })
            .where(eq(players.id, matchedPlayer.id));

          logger.info(`Signed ${matchedPlayer.name} to ${teamName}`);
        } else {
          await channel.send(`❌ Could not find player: ${bidData.playerToSign}`);
          return false;
        }
      }

      // Cut the player
      if (bidData.playerToCut) {
        const matchedPlayer = await PlayerMatcher.findPlayer(bidData.playerToCut);
        if (matchedPlayer) {
          await db
            .update(players)
            .set({ team: 'Free Agent' })
            .where(eq(players.id, matchedPlayer.id));

          logger.info(`Cut ${matchedPlayer.name} from ${teamName}`);
        }
      }

      // Deduct coins from team
      if (bidData.bidAmount > 0) {
        await this.deductCoins(teamName, bidData.bidAmount);
      }

      // Post success message
      const signedName = bidData.playerToSign || 'Unknown';
      const cutName = bidData.playerToCut ? ` (Cut: ${bidData.playerToCut})` : '';
      await channel.send(`⚡ **FA Signing Complete**\n${teamName} signed **${signedName}** for ${bidData.bidAmount} coins${cutName}`);

      return true;
    } catch (error) {
      logger.error('Error processing winning bid:', error);
      return false;
    }
  }

  /**
   * Get team name from message (via user roles or content)
   */
  private async getTeamFromMessage(message: Message): Promise<string | null> {
    // Try to get from user's roles
    const member = message.member;
    if (member) {
      // Look for a role that matches a team name
      const teamRoles = member.roles.cache.filter(role => {
        const roleName = role.name.toLowerCase();
        return this.isTeamName(roleName);
      });

      if (teamRoles.size > 0) {
        return teamRoles.first()?.name || null;
      }
    }

    // Try to parse from message content
    const content = message.content.toLowerCase();
    const teamNames = [
      'Hawks', 'Celtics', 'Nets', 'Hornets', 'Bulls', 'Cavaliers', 'Mavericks', 'Nuggets',
      'Pistons', 'Warriors', 'Rockets', 'Pacers', 'Clippers', 'Lakers', 'Grizzlies', 'Heat',
      'Bucks', 'Timberwolves', 'Pelicans', 'Knicks', 'Thunder', 'Magic', 'Sixers', 'Suns',
      'Trail Blazers', 'Kings', 'Spurs', 'Raptors', 'Jazz', 'Wizards'
    ];

    for (const team of teamNames) {
      if (content.includes(team.toLowerCase())) {
        return team;
      }
    }

    return null;
  }

  /**
   * Check if a string is a team name
   */
  private isTeamName(name: string): boolean {
    const teamNames = [
      'hawks', 'celtics', 'nets', 'hornets', 'bulls', 'cavaliers', 'mavericks', 'nuggets',
      'pistons', 'warriors', 'rockets', 'pacers', 'clippers', 'lakers', 'grizzlies', 'heat',
      'bucks', 'timberwolves', 'pelicans', 'knicks', 'thunder', 'magic', 'sixers', 'suns',
      'trail blazers', 'blazers', 'kings', 'spurs', 'raptors', 'jazz', 'wizards'
    ];
    return teamNames.includes(name.toLowerCase());
  }

  /**
   * Deduct coins from a team
   */
  private async deductCoins(teamName: string, amount: number): Promise<void> {
    const db = DatabaseService.getDb();
    if (!db) return;

    try {
      // Get current coins
      const teamResults = await db
          .select()
          .from(teamCoins)
          .where(eq(teamCoins.team, teamName))
          .limit(1);
      if (teamResults.length > 0) {
        const currentCoins = teamResults[0].coinsRemaining || 0;
        const newCoins = Math.max(0, currentCoins - amount);

        await db
          .update(teamCoins)
          .set({ coinsRemaining: newCoins })
          .where(eq(teamCoins.team, teamName));

        logger.info(`Deducted ${amount} coins from ${teamName}. New balance: ${newCoins}`);
      }
    } catch (error) {
      logger.error('Failed to deduct coins:', error);
    }
  }
}

// Export singleton
export const FABidService = new FABidServiceClass();
