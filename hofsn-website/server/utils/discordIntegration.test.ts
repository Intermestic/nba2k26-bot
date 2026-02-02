import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notifyDiscordNewArticle, checkDiscordWebhookHealth } from './discordWebhook';

describe('Discord Integration - Live Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Live Webhook Health Check', () => {
    it('should successfully connect to the Discord webhook endpoint', async () => {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.log('[Test] DISCORD_WEBHOOK_URL not configured, skipping live test');
        expect(true).toBe(true);
        return;
      }

      const result = await checkDiscordWebhookHealth();
      
      // Verify the webhook is healthy
      expect(result.status).toBe('ok');
      expect(result.botReady).toBe(true);
      
      console.log('[Test] Discord webhook is healthy:', result);
    });
  });

  describe('notifyDiscordNewArticle', () => {
    it('should successfully post a test article to Discord', async () => {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.log('[Test] DISCORD_WEBHOOK_URL not configured, skipping live test');
        expect(true).toBe(true);
        return;
      }

      // Post a test article
      const result = await notifyDiscordNewArticle({
        title: '🧪 HOFSN Integration Test',
        url: 'https://hofsn-sports-bu28nutg.manus.space/highlights',
        imageUrl: 'https://hofsn-sports-bu28nutg.manus.space/hofsn-logo.png',
        excerpt: 'This is an automated test from the HOFSN website integration.',
      });

      expect(result).toBe(true);
      console.log('[Test] Successfully posted test article to Discord');
    });
  });
});
