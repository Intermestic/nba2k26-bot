import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkDiscordWebhookHealth, notifyDiscordNewArticle } from './discordWebhook';

describe('Discord Webhook Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('checkDiscordWebhookHealth', () => {
    it('should return not_configured when DISCORD_WEBHOOK_URL is not set', async () => {
      delete process.env.DISCORD_WEBHOOK_URL;
      
      const result = await checkDiscordWebhookHealth();
      
      expect(result.status).toBe('not_configured');
      expect(result.botConnected).toBe(false);
    });

    it('should check webhook health when URL is configured', async () => {
      // This test will actually call the webhook health endpoint
      // If DISCORD_WEBHOOK_URL is set in the environment, it will test the real endpoint
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      
      if (webhookUrl) {
        const result = await checkDiscordWebhookHealth();
        
        // The health check should return a valid response
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('botReady');
        
        console.log('[Test] Discord webhook health check result:', result);
      } else {
        // Skip if not configured
        console.log('[Test] DISCORD_WEBHOOK_URL not configured, skipping live test');
        expect(true).toBe(true);
      }
    });
  });

  describe('notifyDiscordNewArticle', () => {
    it('should return false when DISCORD_WEBHOOK_URL is not set', async () => {
      delete process.env.DISCORD_WEBHOOK_URL;
      
      const result = await notifyDiscordNewArticle({
        title: 'Test Article',
        url: 'https://example.com/test',
        imageUrl: 'https://example.com/image.png',
      });
      
      expect(result).toBe(false);
    });
  });
});
