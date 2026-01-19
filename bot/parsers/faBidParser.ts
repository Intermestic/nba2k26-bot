/**
 * FA Bid Parser
 * 
 * Parses Free Agency bid messages from Discord to extract:
 * - Player to sign
 * - Player to cut (optional)
 * - Bid amount
 * 
 * Handles various formats:
 * - "Cut [Player] Sign [Player] Bid [Amount]"
 * - "Sign [Player] [Amount]"
 * - "Add [Player] Bid [Amount]"
 */

import { logger } from '../services/logger';

export interface ParsedBid {
  playerToSign: string | null;
  playerToCut: string | null;
  bidAmount: number;
  teamName: string | null;
}

class FABidParserClass {
  /**
   * Parse a bid message
   */
  parse(message: string): ParsedBid | null {
    if (!message || message.trim().length === 0) {
      return null;
    }

    const text = message.trim().toLowerCase();

    // Check for acquisition keywords
    const hasAcquisition = /\b(sign|add|pickup)\b/i.test(text);

    // Check for value keywords OR standalone numbers
    const hasValue = /\b(bid|coins?|\$)\b/i.test(text);
    const hasNumber = /\d+/.test(text);

    // Must have at least one acquisition OR (value keyword OR number)
    if (!hasAcquisition && !hasValue && !hasNumber) {
      return null;
    }

    let playerToCut: string | null = null;
    let playerToSign: string | null = null;
    let bidAmount = 1; // Default bid

    // Step A: Identify cut player (optional)
    // Match everything after cut/drop/waive until we hit sign/add/pickup
    const cutPattern = /\b(cut|drop|waive)\s*:?\s*(.+?)(?:\s+(?:sign|add|pickup))/i;
    const cutMatch = message.match(cutPattern);
    if (cutMatch) {
      playerToCut = this.cleanPlayerName(cutMatch[2]);
    }

    // Step B: Identify signed player (required)
    // Match everything after sign/add/pickup until we hit bid, a number, newline, or end
    const signPattern = /\b(sign|add|pickup)\s*:?\s*(.+?)(?:\s+(?:bid|\d+)|\n|$)/i;
    const signMatch = message.match(signPattern);

    if (!signMatch) {
      // Try alternative pattern: just player name after sign
      const altSignPattern = /\b(sign|add|pickup)\s*:?\s*([A-Za-z\s\-'\.]+)/i;
      const altMatch = message.match(altSignPattern);
      if (altMatch) {
        playerToSign = this.cleanPlayerName(altMatch[2]);
      }
    } else {
      playerToSign = this.cleanPlayerName(signMatch[2]);
    }

    if (!playerToSign) {
      return null; // No player to sign found
    }

    // Step C: Identify bid amount
    // Look for explicit "Bid X" pattern
    const bidKeywordPattern = /\bbid\s*[:\s]*(\d+)/i;
    const bidKeywordMatch = message.match(bidKeywordPattern);

    if (bidKeywordMatch) {
      bidAmount = parseInt(bidKeywordMatch[1]);
    } else {
      // Look for standalone number at end of line
      const standaloneNumberPattern = /(\d+)\s*$/;
      const standaloneMatch = message.match(standaloneNumberPattern);

      if (standaloneMatch) {
        bidAmount = parseInt(standaloneMatch[1]);
      }
    }

    logger.debug(`Parsed bid: Sign ${playerToSign}, Cut ${playerToCut || 'none'}, Amount ${bidAmount}`);

    return {
      playerToSign,
      playerToCut,
      bidAmount,
      teamName: null, // Will be determined from Discord context
    };
  }

  /**
   * Clean up player name
   */
  private cleanPlayerName(name: string): string {
    return name
      .trim()
      .replace(/[^\w\s\-'\.]/g, '') // Remove special characters except common name chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Check if a message looks like a bid
   */
  isBidMessage(message: string): boolean {
    const text = message.toLowerCase();
    return (
      /\b(sign|add|pickup|bid|cut|drop|waive)\b/.test(text) &&
      /[a-z]{2,}/.test(text) // Has at least some text (player name)
    );
  }
}

// Export singleton
export const FABidParser = new FABidParserClass();
