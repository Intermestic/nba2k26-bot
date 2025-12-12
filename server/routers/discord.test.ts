import { describe, it, expect, beforeAll } from 'vitest';
import { getDiscordBotStatus } from '../discord-bot';

describe('Discord Bot Status', () => {
  it('should return bot status with online field', async () => {
    const status = getDiscordBotStatus();
    
    expect(status).toHaveProperty('online');
    expect(status).toHaveProperty('username');
    expect(status).toHaveProperty('channelId');
    expect(status).toHaveProperty('guildId');
    
    expect(typeof status.online).toBe('boolean');
    
    console.log('[Test] Bot status:', JSON.stringify(status, null, 2));
  });
  
  it('should show bot as online if client is ready', async () => {
    const status = getDiscordBotStatus();
    
    // Log the actual status for debugging
    console.log('[Test] Bot online:', status.online);
    console.log('[Test] Bot username:', status.username);
    
    // The bot should be online if it's connected
    if (status.online) {
      expect(status.username).toBeTruthy();
      expect(status.username).toContain('Bot');
    }
  });
});
