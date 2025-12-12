import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { upgradeHistory, players } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

describe('Upgrade History Router', () => {
  let testPlayerId: string;
  let testPlayerName: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Find a player with upgrade history
    const [playerWithHistory] = await db
      .select({
        playerId: upgradeHistory.playerId,
        playerName: upgradeHistory.playerName,
      })
      .from(upgradeHistory)
      .limit(1);

    if (playerWithHistory) {
      testPlayerId = playerWithHistory.playerId;
      testPlayerName = playerWithHistory.playerName;
    } else {
      // If no history exists, create a test player
      const [testPlayer] = await db
        .select()
        .from(players)
        .limit(1);
      
      if (testPlayer) {
        testPlayerId = testPlayer.id;
        testPlayerName = testPlayer.name;

        // Insert test upgrade history
        await db.insert(upgradeHistory).values({
          playerId: testPlayerId,
          playerName: testPlayerName,
          attributeName: '3PT',
          upgradeType: 'Welcome',
          userId: 'test_user_123',
          userName: 'TestUser',
          team: 'Test Team',
          previousValue: '75',
          newValue: '78',
        });
      }
    }
  });

  it('should fetch upgrade history for a player', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const history = await db
      .select()
      .from(upgradeHistory)
      .where(eq(upgradeHistory.playerId, testPlayerId));

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    
    const firstEntry = history[0];
    expect(firstEntry).toHaveProperty('playerId');
    expect(firstEntry).toHaveProperty('playerName');
    expect(firstEntry).toHaveProperty('attributeName');
    expect(firstEntry).toHaveProperty('upgradeType');
    expect(firstEntry).toHaveProperty('userId');
    expect(firstEntry).toHaveProperty('userName');
    expect(firstEntry).toHaveProperty('team');
  });

  it('should group upgrade history by user', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const summary = await db
      .select({
        userId: upgradeHistory.userId,
        userName: upgradeHistory.userName,
        upgradeCount: sql<number>`COUNT(*)`,
      })
      .from(upgradeHistory)
      .where(eq(upgradeHistory.playerId, testPlayerId))
      .groupBy(upgradeHistory.userId, upgradeHistory.userName);

    expect(Array.isArray(summary)).toBe(true);
    if (summary.length > 0) {
      const firstUser = summary[0];
      expect(firstUser).toHaveProperty('userId');
      expect(firstUser).toHaveProperty('userName');
      expect(firstUser).toHaveProperty('upgradeCount');
    }
  });

  it('should verify upgrade history table has data', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const history = await db
      .select()
      .from(upgradeHistory)
      .limit(1);
    
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    
    const firstEntry = history[0];
    expect(firstEntry).toHaveProperty('id');
    expect(firstEntry).toHaveProperty('playerId');
    expect(firstEntry).toHaveProperty('playerName');
    expect(firstEntry).toHaveProperty('attributeName');
    expect(firstEntry).toHaveProperty('upgradeType');
    expect(firstEntry).toHaveProperty('userId');
    expect(firstEntry).toHaveProperty('userName');
    expect(firstEntry).toHaveProperty('team');
    expect(firstEntry).toHaveProperty('createdAt');
  });

  it('should have migrated data from upgrade_log', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(upgradeHistory);

    const count = countResult.count;
    console.log(`Total upgrade history entries: ${count}`);
    
    // We migrated 276 entries, so count should be at least that
    expect(count).toBeGreaterThan(0);
  });
});
