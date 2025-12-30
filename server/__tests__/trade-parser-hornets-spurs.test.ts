import { describe, it, expect } from 'vitest';
import { parseTrade } from '../trade-parser';

/**
 * Test for trade parser fix - message ID 1455519963698696303
 * 
 * Bug: Trade message with format "Team Send:" (without asterisks) was not being parsed
 * Fix: Updated regex patterns to handle optional asterisks and both "Send" and "Sends" variations
 */

describe('Trade Parser - Hornets/Spurs Trade (Message 1455519963698696303)', () => {
  it('should parse trade with "Team Send:" format (no asterisks)', () => {
    const tradeMessage = `Hornets Send:
Devin Vassell 81 (10)
Rudy Gobert 83 (12)
Collin Gillespie 79 (9)
Total: 243 (31)

Spurs Send:
Zach Edey 79 (9)
Mikal Bridges 85 (15)
Bradley Beal 77 (13)
Total: 241 (37)`;

    const result = parseTrade(tradeMessage);

    expect(result).not.toBeNull();
    expect(result).toBeTruthy();
    
    if (result) {
      // Check teams
      expect(result.team1).toBe('Hornets');
      expect(result.team2).toBe('Spurs');
      
      // Check Hornets players
      expect(result.team1Players).toContain('Devin Vassell');
      expect(result.team1Players).toContain('Rudy Gobert');
      expect(result.team1Players).toContain('Collin Gillespie');
      expect(result.team1Players.length).toBe(3);
      
      // Check Spurs players
      expect(result.team2Players).toContain('Zach Edey');
      expect(result.team2Players).toContain('Mikal Bridges');
      expect(result.team2Players).toContain('Bradley Beal');
      expect(result.team2Players.length).toBe(3);
    }
  });

  it('should still parse trade with "**Team Sends:**" format (with asterisks)', () => {
    const tradeMessage = `**Hornets Sends:**
Devin Vassell 81 (10)
Rudy Gobert 83 (12)

**Spurs Sends:**
Zach Edey 79 (9)
Mikal Bridges 85 (15)`;

    const result = parseTrade(tradeMessage);

    expect(result).not.toBeNull();
    expect(result).toBeTruthy();
    
    if (result) {
      expect(result.team1).toBe('Hornets');
      expect(result.team2).toBe('Spurs');
      expect(result.team1Players.length).toBe(2);
      expect(result.team2Players.length).toBe(2);
    }
  });

  it('should parse trade with mixed formats (one with asterisks, one without)', () => {
    const tradeMessage = `**Hornets Sends:**
Devin Vassell 81 (10)

Spurs Send:
Zach Edey 79 (9)`;

    const result = parseTrade(tradeMessage);

    expect(result).not.toBeNull();
    expect(result).toBeTruthy();
    
    if (result) {
      expect(result.team1).toBe('Hornets');
      expect(result.team2).toBe('Spurs');
    }
  });
});
