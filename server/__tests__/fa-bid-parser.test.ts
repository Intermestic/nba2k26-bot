import { describe, it, expect } from 'vitest';
import { parseBidMessage } from '../fa-bid-parser';

describe('FA Bid Parser', () => {
  describe('Valid Bid Formats', () => {
    it('should parse basic cut + sign format', () => {
      const result = parseBidMessage('Cut John Doe sign Jane Smith');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 1,
        dropPlayer: 'John Doe'
      });
    });

    it('should parse with bid keyword and amount', () => {
      const result = parseBidMessage('Cut John Doe sign Jane Smith bid 5');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 5,
        dropPlayer: 'John Doe'
      });
    });

    it('should parse with standalone number at end', () => {
      const result = parseBidMessage('Cut John Doe sign Jane Smith 10');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 10,
        dropPlayer: 'John Doe'
      });
    });

    it('should parse sign without cut (no drop player)', () => {
      const result = parseBidMessage('Sign LeBron James bid 50');
      expect(result).toEqual({
        playerName: 'LeBron James',
        bidAmount: 50,
        dropPlayer: undefined
      });
    });

    it('should default to bid amount 1 when not specified', () => {
      const result = parseBidMessage('Sign Kevin Durant');
      expect(result).toEqual({
        playerName: 'Kevin Durant',
        bidAmount: 1,
        dropPlayer: undefined
      });
    });
  });

  describe('Different Action Verbs', () => {
    it('should parse with "drop" instead of "cut"', () => {
      const result = parseBidMessage('Drop John Doe sign Jane Smith');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 1,
        dropPlayer: 'John Doe'
      });
    });

    it('should parse with "waive" instead of "cut"', () => {
      const result = parseBidMessage('Waive John Doe sign Jane Smith');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 1,
        dropPlayer: 'John Doe'
      });
    });

    it('should parse with "add" instead of "sign"', () => {
      const result = parseBidMessage('Cut John Doe add Jane Smith');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 1,
        dropPlayer: 'John Doe'
      });
    });

    it('should parse with "pickup" instead of "sign"', () => {
      const result = parseBidMessage('Cut John Doe pickup Jane Smith');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 1,
        dropPlayer: 'John Doe'
      });
    });
  });

  describe('Edge Cases: Player Names with Acquisition Keywords', () => {
    it('should correctly parse "Saddiq" (contains "add")', () => {
      const result = parseBidMessage('Cut Saddiq Bey sign Christian Koloko');
      expect(result).toEqual({
        playerName: 'Christian Koloko',
        bidAmount: 1,
        dropPlayer: 'Saddiq Bey'
      });
    });

    it('should correctly parse "Addison" (starts with "add")', () => {
      const result = parseBidMessage('Cut Addison Patterson sign John Doe bid 5');
      expect(result).toEqual({
        playerName: 'John Doe',
        bidAmount: 5,
        dropPlayer: 'Addison Patterson'
      });
    });

    it('should correctly parse "Signor" (contains "sign")', () => {
      const result = parseBidMessage('Drop Signor Michaels add Kevin Knox');
      expect(result).toEqual({
        playerName: 'Kevin Knox',
        bidAmount: 1,
        dropPlayer: 'Signor Michaels'
      });
    });

    it('should correctly parse names containing "bid"', () => {
      const result = parseBidMessage('Cut Bidwell Johnson sign Mike Davis 3');
      expect(result).toEqual({
        playerName: 'Mike Davis',
        bidAmount: 3,
        dropPlayer: 'Bidwell Johnson'
      });
    });

    it('should correctly parse when signing player has keyword in name', () => {
      const result = parseBidMessage('Cut John Doe sign Saddiq Bey bid 7');
      expect(result).toEqual({
        playerName: 'Saddiq Bey',
        bidAmount: 7,
        dropPlayer: 'John Doe'
      });
    });

    it('should handle both players having keywords in names', () => {
      const result = parseBidMessage('Cut Addison Smith sign Saddiq Bey 10');
      expect(result).toEqual({
        playerName: 'Saddiq Bey',
        bidAmount: 10,
        dropPlayer: 'Addison Smith'
      });
    });
  });

  describe('Case Insensitivity', () => {
    it('should parse uppercase keywords', () => {
      const result = parseBidMessage('CUT John Doe SIGN Jane Smith BID 5');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 5,
        dropPlayer: 'John Doe'
      });
    });

    it('should parse mixed case', () => {
      const result = parseBidMessage('cUt John Doe SiGn Jane Smith bId 5');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 5,
        dropPlayer: 'John Doe'
      });
    });

    it('should preserve player name casing', () => {
      const result = parseBidMessage('cut LEBRON JAMES sign kevin durant');
      expect(result).toEqual({
        playerName: 'kevin durant',
        bidAmount: 1,
        dropPlayer: 'LEBRON JAMES'
      });
    });
  });

  describe('Bid Amount Variations', () => {
    it('should parse "bid: 5" format', () => {
      const result = parseBidMessage('Sign John Doe bid: 5');
      expect(result).toEqual({
        playerName: 'John Doe',
        bidAmount: 5,
        dropPlayer: undefined
      });
    });

    it('should parse "bid 100" (large amount)', () => {
      const result = parseBidMessage('Sign John Doe bid 100');
      expect(result).toEqual({
        playerName: 'John Doe',
        bidAmount: 100,
        dropPlayer: undefined
      });
    });

    it('should parse standalone number without bid keyword', () => {
      const result = parseBidMessage('Sign John Doe 25');
      expect(result).toEqual({
        playerName: 'John Doe',
        bidAmount: 25,
        dropPlayer: undefined
      });
    });

    it('should prioritize bid keyword over standalone number', () => {
      const result = parseBidMessage('Sign John Doe bid 10');
      expect(result).toEqual({
        playerName: 'John Doe',
        bidAmount: 10,
        dropPlayer: undefined
      });
    });
  });

  describe('Multi-word Player Names', () => {
    it('should parse three-word names', () => {
      const result = parseBidMessage('Cut John Paul Jones sign Mary Jane Watson');
      expect(result).toEqual({
        playerName: 'Mary Jane Watson',
        bidAmount: 1,
        dropPlayer: 'John Paul Jones'
      });
    });

    it('should parse hyphenated names', () => {
      const result = parseBidMessage('Cut Karl-Anthony Towns sign Michael Porter Jr.');
      expect(result).toEqual({
        playerName: 'Michael Porter Jr.',
        bidAmount: 1,
        dropPlayer: 'Karl-Anthony Towns'
      });
    });

    it('should parse names with suffixes', () => {
      const result = parseBidMessage('Cut Gary Trent Jr. sign Otto Porter Jr. bid 3');
      expect(result).toEqual({
        playerName: 'Otto Porter Jr.',
        bidAmount: 3,
        dropPlayer: 'Gary Trent Jr.'
      });
    });
  });

  describe('Error Cases: Should Return Null', () => {
    it('should return null for message without acquisition keywords', () => {
      const result = parseBidMessage('John Doe is a great player');
      expect(result).toBeNull();
    });

    it('should return null for message with only cut (no sign)', () => {
      const result = parseBidMessage('Cut John Doe');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseBidMessage('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace only', () => {
      const result = parseBidMessage('   ');
      expect(result).toBeNull();
    });

    it('should return null for message with bid keyword but no sign', () => {
      const result = parseBidMessage('bid 5 on John Doe');
      expect(result).toBeNull();
    });

    it('should return null for random text', () => {
      const result = parseBidMessage('Hello world this is a test');
      expect(result).toBeNull();
    });
  });

  describe('Alternative Value Keywords', () => {
    it('should parse with "coin" keyword', () => {
      const result = parseBidMessage('Sign John Doe coin 5');
      expect(result).toEqual({
        playerName: 'John Doe coin',
        bidAmount: 5,
        dropPlayer: undefined
      });
    });

    it('should parse with "coins" keyword', () => {
      const result = parseBidMessage('Sign John Doe coins 5');
      expect(result).toEqual({
        playerName: 'John Doe coins',
        bidAmount: 5,
        dropPlayer: undefined
      });
    });

    it('should parse with "$" symbol', () => {
      const result = parseBidMessage('Sign John Doe $ 5');
      expect(result).toEqual({
        playerName: 'John Doe $',
        bidAmount: 5,
        dropPlayer: undefined
      });
    });
  });

  describe('Real-World Examples', () => {
    it('should parse Jazz example from bug report', () => {
      const result = parseBidMessage('Cut Saddiq bey sign Christian Koloko');
      expect(result).toEqual({
        playerName: 'Christian Koloko',
        bidAmount: 1,
        dropPlayer: 'Saddiq bey'
      });
    });

    it('should parse typical FA bid with amount', () => {
      const result = parseBidMessage('Drop Isaiah Joe sign Miles McBride bid 31');
      expect(result).toEqual({
        playerName: 'Miles McBride',
        bidAmount: 31,
        dropPlayer: 'Isaiah Joe'
      });
    });

    it('should parse updated bid (same player, new amount)', () => {
      const result = parseBidMessage('Drop Isaiah Joe sign Miles McBride bid 46');
      expect(result).toEqual({
        playerName: 'Miles McBride',
        bidAmount: 46,
        dropPlayer: 'Isaiah Joe'
      });
    });

    it('should parse simple sign without drop', () => {
      const result = parseBidMessage('Sign Giannis Antetokounmpo bid 100');
      expect(result).toEqual({
        playerName: 'Giannis Antetokounmpo',
        bidAmount: 100,
        dropPlayer: undefined
      });
    });
  });

  describe('Edge Cases: Spacing and Formatting', () => {
    it('should handle extra spaces between words', () => {
      const result = parseBidMessage('Cut  John  Doe   sign   Jane  Smith');
      expect(result).toEqual({
        playerName: 'Jane  Smith',
        bidAmount: 1,
        dropPlayer: 'John  Doe'
      });
    });

    it('should handle leading/trailing whitespace', () => {
      const result = parseBidMessage('  Cut John Doe sign Jane Smith  ');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 1,
        dropPlayer: 'John Doe'
      });
    });

    it('should handle tab characters', () => {
      const result = parseBidMessage('Cut\tJohn Doe\tsign\tJane Smith');
      expect(result).toEqual({
        playerName: 'Jane Smith',
        bidAmount: 1,
        dropPlayer: 'John Doe'
      });
    });
  });

  describe('Boundary Cases', () => {
    it('should handle single-word player names', () => {
      const result = parseBidMessage('Cut Shaq sign Kobe');
      expect(result).toEqual({
        playerName: 'Kobe',
        bidAmount: 1,
        dropPlayer: 'Shaq'
      });
    });

    it('should handle very long player names', () => {
      const result = parseBidMessage('Cut Firstname Middlename Lastname Junior sign Another Very Long Player Name');
      expect(result).toEqual({
        playerName: 'Another Very Long Player Name',
        bidAmount: 1,
        dropPlayer: 'Firstname Middlename Lastname Junior'
      });
    });

    it('should handle bid amount of 0', () => {
      const result = parseBidMessage('Sign John Doe bid 0');
      expect(result).toEqual({
        playerName: 'John Doe',
        bidAmount: 0,
        dropPlayer: undefined
      });
    });
  });
});
