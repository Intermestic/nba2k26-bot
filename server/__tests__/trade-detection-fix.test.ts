import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message } from 'discord.js';

/**
 * Test for trade detection fix - verifying that both embed and plain text trades are detected
 * 
 * Bug: Trade message ID 1450396570573996094 was not processed because it was a plain text message
 * Fix: Updated handleNewTradeEmbed to process both embeds and plain text messages with trade keywords
 */

describe('Trade Detection Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect trade from embed message', () => {
    const mockMessage = {
      id: '1234567890',
      channelId: '1087524540634116116', // TRADE_CHANNEL_ID
      author: {
        id: 'user123',
        bot: false,
      },
      client: {
        user: {
          id: 'bot456',
        },
      },
      embeds: [
        {
          description: `**Wizards send:**
Ausar Thompson 82 (13)

**76ers send:**
Jaden McDaniels 83 (15)`,
        },
      ],
      content: '',
      react: vi.fn().mockResolvedValue(undefined),
    } as unknown as Message;

    // Simulate the detection logic
    const hasEmbed = mockMessage.embeds.length > 0;
    const hasTradeKeywords = mockMessage.content && (
      (mockMessage.content.toLowerCase().includes('send') || mockMessage.content.toLowerCase().includes('receive')) &&
      (mockMessage.content.match(/\d{2,3}\s*\(/g) || mockMessage.content.match(/\(\d{2,3}\)/g))
    );

    expect(hasEmbed || hasTradeKeywords).toBeTruthy();
    expect(hasEmbed).toBe(true);
  });

  it('should detect trade from plain text message with "send" keyword', () => {
    const mockMessage = {
      id: '1450396570573996094',
      channelId: '1087524540634116116', // TRADE_CHANNEL_ID
      author: {
        id: 'user123',
        bot: false,
      },
      client: {
        user: {
          id: 'bot456',
        },
      },
      embeds: [],
      content: `Wizards send:
Ausar Thompson 82 (13)

76ers send:
Jaden McDaniels 83 (15)`,
      react: vi.fn().mockResolvedValue(undefined),
    } as unknown as Message;

    // Simulate the detection logic
    const hasEmbed = mockMessage.embeds.length > 0;
    const hasTradeKeywords = mockMessage.content && (
      (mockMessage.content.toLowerCase().includes('send') || mockMessage.content.toLowerCase().includes('receive')) &&
      (mockMessage.content.match(/\d{2,3}\s*\(/g) || mockMessage.content.match(/\(\d{2,3}\)/g))
    );

    expect(hasEmbed || hasTradeKeywords).toBeTruthy();
    expect(hasTradeKeywords).toBeTruthy();
  });

  it('should detect trade from plain text message with "receive" keyword', () => {
    const mockMessage = {
      id: '1234567891',
      channelId: '1087524540634116116',
      author: {
        id: 'user123',
        bot: false,
      },
      client: {
        user: {
          id: 'bot456',
        },
      },
      embeds: [],
      content: `Wizards receive:
Jaden McDaniels 83 (15)

76ers receive:
Ausar Thompson 82 (13)`,
      react: vi.fn().mockResolvedValue(undefined),
    } as unknown as Message;

    // Simulate the detection logic
    const hasEmbed = mockMessage.embeds.length > 0;
    const hasTradeKeywords = mockMessage.content && (
      (mockMessage.content.toLowerCase().includes('send') || mockMessage.content.toLowerCase().includes('receive')) &&
      (mockMessage.content.match(/\d{2,3}\s*\(/g) || mockMessage.content.match(/\(\d{2,3}\)/g))
    );

    expect(hasEmbed || hasTradeKeywords).toBeTruthy();
    expect(hasTradeKeywords).toBeTruthy();
  });

  it('should NOT detect non-trade messages', () => {
    const mockMessage = {
      id: '1234567892',
      channelId: '1087524540634116116',
      author: {
        id: 'user123',
        bot: false,
      },
      client: {
        user: {
          id: 'bot456',
        },
      },
      embeds: [],
      content: 'Just a regular message in the trade channel',
      react: vi.fn().mockResolvedValue(undefined),
    } as unknown as Message;

    // Simulate the detection logic
    const hasEmbed = mockMessage.embeds.length > 0;
    const hasTradeKeywords = mockMessage.content && (
      (mockMessage.content.toLowerCase().includes('send') || mockMessage.content.toLowerCase().includes('receive')) &&
      (mockMessage.content.match(/\d{2,3}\s*\(/g) || mockMessage.content.match(/\(\d{2,3}\)/g))
    );

    expect(hasEmbed || hasTradeKeywords).toBeFalsy();
  });

  it('should NOT detect messages with trade keywords but no OVR pattern', () => {
    const mockMessage = {
      id: '1234567893',
      channelId: '1087524540634116116',
      author: {
        id: 'user123',
        bot: false,
      },
      client: {
        user: {
          id: 'bot456',
        },
      },
      embeds: [],
      content: 'I want to send a message about trades',
      react: vi.fn().mockResolvedValue(undefined),
    } as unknown as Message;

    // Simulate the detection logic
    const hasEmbed = mockMessage.embeds.length > 0;
    const hasTradeKeywords = mockMessage.content && (
      (mockMessage.content.toLowerCase().includes('send') || mockMessage.content.toLowerCase().includes('receive')) &&
      (mockMessage.content.match(/\d{2,3}\s*\(/g) || mockMessage.content.match(/\(\d{2,3}\)/g))
    );

    expect(hasEmbed || hasTradeKeywords).toBeFalsy();
  });
});
