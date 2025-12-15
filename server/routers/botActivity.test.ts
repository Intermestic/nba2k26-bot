import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { botLogs } from '../../drizzle/schema';
import { appRouter } from '../routers';

describe('Bot Activity Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Create a test caller
    caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    // Insert test data
    const db = await getDb();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await db.insert(botLogs).values([
      {
        createdAt: now,
        eventType: 'command',
        level: 'info',
        commandName: '!help',
        userId: 'user1',
        username: 'TestUser1',
        channelId: 'channel1',
        message: 'Help command executed',
      },
      {
        createdAt: now,
        eventType: 'command',
        level: 'info',
        commandName: '!help',
        userId: 'user2',
        username: 'TestUser2',
        channelId: 'channel1',
        message: 'Help command executed',
      },
      {
        createdAt: now,
        eventType: 'command',
        level: 'info',
        commandName: '!sync-team-roles',
        userId: 'user1',
        username: 'TestUser1',
        channelId: 'channel1',
        message: 'Sync command executed',
      },
      {
        createdAt: now,
        eventType: 'error',
        level: 'error',
        commandName: null,
        userId: null,
        username: null,
        channelId: 'channel1',
        message: 'Test error',
      },
      {
        createdAt: yesterday,
        eventType: 'command',
        level: 'info',
        commandName: '!badge',
        userId: 'user3',
        username: 'TestUser3',
        channelId: 'channel1',
        message: 'Badge command executed',
      },
    ]);
  });

  it('should get command usage statistics', async () => {
    const result = await caller.botActivity.getCommandStats({});

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that !help has highest count (2 uses)
    const helpCommand = result.find((stat) => stat.command === '!help');
    expect(helpCommand).toBeDefined();
    expect(helpCommand?.count).toBeGreaterThanOrEqual(2);
  });

  it('should filter command stats by date range', async () => {
    const today = new Date().toISOString().split('T')[0];
    const result = await caller.botActivity.getCommandStats({
      startDate: today,
      endDate: today,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    // Should not include yesterday's !badge command
    const badgeCommand = result.find((stat) => stat.command === '!badge');
    expect(badgeCommand).toBeUndefined();
  });

  it('should get error rate statistics', async () => {
    const result = await caller.botActivity.getErrorStats({
      groupBy: 'day',
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that error rate is calculated
    const todayStats = result[result.length - 1];
    expect(todayStats.errorRate).toBeDefined();
    expect(typeof todayStats.errorRate).toBe('number');
    expect(Number(todayStats.errorCount)).toBeGreaterThan(0);
  });

  it('should get activity timeline', async () => {
    const result = await caller.botActivity.getActivityTimeline({
      groupBy: 'day',
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that timeline has required fields
    const entry = result[0];
    expect(entry.period).toBeDefined();
    expect(entry.commandCount).toBeDefined();
    expect(entry.errorCount).toBeDefined();
    expect(entry.totalCount).toBeDefined();
  });

  it('should get summary statistics', async () => {
    const result = await caller.botActivity.getSummaryStats({});

    expect(result).toBeDefined();
    expect(Number(result.totalEvents)).toBeGreaterThan(0);
    expect(Number(result.totalCommands)).toBeGreaterThan(0);
    expect(Number(result.totalErrors)).toBeGreaterThan(0);
    expect(Number(result.uniqueUsers)).toBeGreaterThan(0);
    expect(result.errorRate).toBeDefined();
    expect(typeof result.errorRate).toBe('number');
  });

  it('should get most active users', async () => {
    const result = await caller.botActivity.getMostActiveUsers({
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that users are sorted by command count
    const firstUser = result[0];
    expect(firstUser.userId).toBeDefined();
    expect(firstUser.commandCount).toBeGreaterThan(0);

    // Verify descending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].commandCount).toBeGreaterThanOrEqual(result[i].commandCount);
    }
  });

  it('should export statistics to CSV', async () => {
    const result = await caller.botActivity.exportStats({});

    expect(result).toBeDefined();
    expect(result.csv).toBeDefined();
    expect(typeof result.csv).toBe('string');
    expect(result.rowCount).toBeGreaterThan(0);

    // Check CSV format
    const lines = result.csv.split('\n');
    expect(lines.length).toBeGreaterThan(1); // Header + at least one row
    expect(lines[0]).toContain('Timestamp');
    expect(lines[0]).toContain('Event Type');
    expect(lines[0]).toContain('Command');
  });

  it('should handle empty date ranges gracefully', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const result = await caller.botActivity.getCommandStats({
      startDate: futureDate.toISOString().split('T')[0],
      endDate: futureDate.toISOString().split('T')[0],
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});
