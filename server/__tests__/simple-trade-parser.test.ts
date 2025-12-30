import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { parseTradeFromMessage } from '../simple-trade-parser';
import { Message, EmbedBuilder } from 'discord.js';

/**
 * Test for improved simple-trade-parser
 * Verifies that the parser can handle the "Team Send:" format
 * This was the format causing the !check-trade command to fail
 */

describe('Simple Trade Parser - Improved Version', () => {
  // Mock Discord Message object
  const createMockMessage = (description: string): Partial<Message> => {
    return {
      id: '1455519963698696303',
      partial: false,
      embeds: [
        {
          description,
          title: 'Trade Proposal',
          fields: [],
        } as any,
      ],
      content: '',
      fetch: vi.fn().mockResolvedValue(this),
    } as any;
  };

  it('should parse trade with "Team Send:" format (no asterisks)', async () => {
    const tradeDescription = `Hornets Send:
Devin Vassell 81 (10)
Rudy Gobert 83 (12)
Collin Gillespie 79 (9)
Total: 243 (31)

Spurs Send:
Zach Edey 79 (9)
Mikal Bridges 85 (15)
Bradley Beal 77 (13)
Total: 241 (37)`;

    const mockMessage = createMockMessage(tradeDescription);
    const result = await parseTradeFromMessage(mockMessage as Message);

    expect(result).not.toBeNull();
    expect(result).toBeTruthy();
    
    if (result) {
      // Check teams
      expect(result.team1).toBe('Hornets');
      expect(result.team2).toBe('Spurs');
      
      // Check Hornets players
      expect(result.team1Players).toHaveLength(3);
      expect(result.team1Players?.map(p => p.name)).toContain('Devin Vassell');
      expect(result.team1Players?.map(p => p.name)).toContain('Rudy Gobert');
      expect(result.team1Players?.map(p => p.name)).toContain('Collin Gillespie');
      
      // Check player stats
      const vassell = result.team1Players?.find(p => p.name === 'Devin Vassell');
      expect(vassell?.overall).toBe(81);
      expect(vassell?.salary).toBe(10);
      
      // Check Spurs players
      expect(result.team2Players).toHaveLength(3);
      expect(result.team2Players?.map(p => p.name)).toContain('Zach Edey');
      expect(result.team2Players?.map(p => p.name)).toContain('Mikal Bridges');
      expect(result.team2Players?.map(p => p.name)).toContain('Bradley Beal');
      
      // Check player stats
      const edey = result.team2Players?.find(p => p.name === 'Zach Edey');
      expect(edey?.overall).toBe(79);
      expect(edey?.salary).toBe(9);
    }
  });

  it('should parse trade with "**Team Sends:**" format (with asterisks)', async () => {
    const tradeDescription = `**Hornets Sends:**
Devin Vassell 81 (10)
Rudy Gobert 83 (12)

**Spurs Sends:**
Zach Edey 79 (9)
Mikal Bridges 85 (15)`;

    const mockMessage = createMockMessage(tradeDescription);
    const result = await parseTradeFromMessage(mockMessage as Message);

    expect(result).not.toBeNull();
    expect(result).toBeTruthy();
    
    if (result) {
      expect(result.team1).toBe('Hornets');
      expect(result.team2).toBe('Spurs');
      expect(result.team1Players).toHaveLength(2);
      expect(result.team2Players).toHaveLength(2);
    }
  });

  it('should parse trade with mixed formats (one with asterisks, one without)', async () => {
    const tradeDescription = `**Hornets Sends:**
Devin Vassell 81 (10)
Rudy Gobert 83 (12)

Spurs Send:
Zach Edey 79 (9)
Mikal Bridges 85 (15)`;

    const mockMessage = createMockMessage(tradeDescription);
    const result = await parseTradeFromMessage(mockMessage as Message);

    expect(result).not.toBeNull();
    expect(result).toBeTruthy();
    
    if (result) {
      expect(result.team1).toBe('Hornets');
      expect(result.team2).toBe('Spurs');
      expect(result.team1Players?.length).toBeGreaterThan(0);
      expect(result.team2Players?.length).toBeGreaterThan(0);
    }
  });

  it('should handle trades with "badges" notation', async () => {
    const tradeDescription = `Lakers Send:
LeBron James 88 (15 badges)
Anthony Davis 87 (14 badges)

Celtics Send:
Jayson Tatum 86 (13 badges)
Jaylen Brown 85 (12 badges)`;

    const mockMessage = createMockMessage(tradeDescription);
    const result = await parseTradeFromMessage(mockMessage as Message);

    expect(result).not.toBeNull();
    expect(result).toBeTruthy();
    
    if (result) {
      expect(result.team1).toBe('Lakers');
      expect(result.team2).toBe('Celtics');
      expect(result.team1Players).toHaveLength(2);
      expect(result.team2Players).toHaveLength(2);
      
      // Verify badges notation is handled
      const lebron = result.team1Players?.find(p => p.name === 'LeBron James');
      expect(lebron?.overall).toBe(88);
      expect(lebron?.salary).toBe(15);
    }
  });

  it('should return null for invalid trade format', async () => {
    const invalidDescription = `This is not a trade message
Just some random text
No teams or players here`;

    const mockMessage = createMockMessage(invalidDescription);
    const result = await parseTradeFromMessage(mockMessage as Message);

    expect(result).toBeNull();
  });

  it('should return null if only one team is found', async () => {
    const invalidDescription = `Lakers Send:
LeBron James 88 (15)
Anthony Davis 87 (14)

No second team mentioned`;

    const mockMessage = createMockMessage(invalidDescription);
    const result = await parseTradeFromMessage(mockMessage as Message);

    expect(result).toBeNull();
  });
});
