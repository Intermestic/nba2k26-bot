import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { players, playerUpgrades } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { appRouter } from '../routers';

describe('7GM Per-Attribute Tracking', () => {
  let db: any;
  const testPlayerId = 'test-player-7gm-attr';
  const testPlayerName = 'Test Player 7GM';

  beforeAll(async () => {
    db = await getDb();
    
    // Clean up any existing test data
    await db.delete(playerUpgrades).where(eq(playerUpgrades.playerId, testPlayerId));
    await db.delete(players).where(eq(players.id, testPlayerId));
    
    // Create test player
    await db.insert(players).values({
      id: testPlayerId,
      name: testPlayerName,
      overall: 85,
      team: 'Test Team',
      isRookie: 0,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(playerUpgrades).where(eq(playerUpgrades.playerId, testPlayerId));
    await db.delete(players).where(eq(players.id, testPlayerId));
  });

  it('should track +6 cap per individual attribute, not total', async () => {
    // Scenario: Player does +3 3PT, +3 Dunk, +3 3PT
    // Expected: 3PT = 6/6 (capped), Dunk = 3/6 (3 remaining)
    
    // Add first 3PT upgrade (+3)
    await db.insert(playerUpgrades).values({
      playerId: testPlayerId,
      playerName: testPlayerName,
      upgradeType: 'attribute',
      statName: '3PT',
      statIncrease: 3,
      newStatValue: 83,
      metadata: JSON.stringify({ upgradeType: '7GM' }),
    });

    // Add Dunk upgrade (+3)
    await db.insert(playerUpgrades).values({
      playerId: testPlayerId,
      playerName: testPlayerName,
      upgradeType: 'attribute',
      statName: 'Dunk',
      statIncrease: 3,
      newStatValue: 88,
      metadata: JSON.stringify({ upgradeType: '7GM' }),
    });

    // Add second 3PT upgrade (+3)
    await db.insert(playerUpgrades).values({
      playerId: testPlayerId,
      playerName: testPlayerName,
      upgradeType: 'attribute',
      statName: '3PT',
      statIncrease: 3,
      newStatValue: 86,
      metadata: JSON.stringify({ upgradeType: '7GM' }),
    });

    // Query the upgrade limits
    const caller = appRouter.createCaller({ db, user: null });
    const result = await caller.upgradeLimits.getUpgradeLimitStatus({
      filterTeam: 'Test Team',
      filterStatus: 'all',
      filterType: 'all',
    });

    const testPlayer = result.players.find((p: any) => p.id === testPlayerId);
    
    expect(testPlayer).toBeDefined();
    expect(testPlayer.sevenGameByAttribute).toBeDefined();
    expect(testPlayer.sevenGameByAttribute.length).toBe(2); // 3PT and Dunk

    // Find 3PT attribute
    const threePT = testPlayer.sevenGameByAttribute.find((a: any) => a.attribute === '3PT');
    expect(threePT).toBeDefined();
    expect(threePT.used).toBe(6); // +3 + +3 = 6
    expect(threePT.remaining).toBe(0); // 6 - 6 = 0
    expect(threePT.status).toBe('at_cap');

    // Find Dunk attribute
    const dunk = testPlayer.sevenGameByAttribute.find((a: any) => a.attribute === 'Dunk');
    expect(dunk).toBeDefined();
    expect(dunk.used).toBe(3); // +3
    expect(dunk.remaining).toBe(3); // 6 - 3 = 3
    expect(dunk.status).toBe('ok');

    // Overall status should be 'at_cap' because 3PT is at cap
    expect(testPlayer.sevenGameStatus).toBe('at_cap');
  });

  it('should allow +6 on multiple different attributes independently', async () => {
    // Clean previous test data
    await db.delete(playerUpgrades).where(eq(playerUpgrades.playerId, testPlayerId));

    // Add +6 to Mid Range
    await db.insert(playerUpgrades).values({
      playerId: testPlayerId,
      playerName: testPlayerName,
      upgradeType: 'attribute',
      statName: 'Mid Range',
      statIncrease: 6,
      newStatValue: 86,
      metadata: JSON.stringify({ upgradeType: '7GM' }),
    });

    // Add +6 to Speed
    await db.insert(playerUpgrades).values({
      playerId: testPlayerId,
      playerName: testPlayerName,
      upgradeType: 'attribute',
      statName: 'Speed',
      statIncrease: 6,
      newStatValue: 86,
      metadata: JSON.stringify({ upgradeType: '7GM' }),
    });

    // Query the upgrade limits
    const caller = appRouter.createCaller({ db, user: null });
    const result = await caller.upgradeLimits.getUpgradeLimitStatus({
      filterTeam: 'Test Team',
      filterStatus: 'all',
      filterType: 'all',
    });

    const testPlayer = result.players.find((p: any) => p.id === testPlayerId);
    
    expect(testPlayer.sevenGameByAttribute.length).toBe(2); // Mid Range and Speed

    // Both should be at cap
    const midRange = testPlayer.sevenGameByAttribute.find((a: any) => a.attribute === 'Mid Range');
    expect(midRange.used).toBe(6);
    expect(midRange.remaining).toBe(0);
    expect(midRange.status).toBe('at_cap');

    const speed = testPlayer.sevenGameByAttribute.find((a: any) => a.attribute === 'Speed');
    expect(speed.used).toBe(6);
    expect(speed.remaining).toBe(0);
    expect(speed.status).toBe('at_cap');

    // Overall status should be 'at_cap'
    expect(testPlayer.sevenGameStatus).toBe('at_cap');
  });

  it('should show near_cap status when attribute has +5', async () => {
    // Clean previous test data
    await db.delete(playerUpgrades).where(eq(playerUpgrades.playerId, testPlayerId));

    // Add +5 to Strength
    await db.insert(playerUpgrades).values({
      playerId: testPlayerId,
      playerName: testPlayerName,
      upgradeType: 'attribute',
      statName: 'Strength',
      statIncrease: 5,
      newStatValue: 85,
      metadata: JSON.stringify({ upgradeType: '7GM' }),
    });

    // Query the upgrade limits
    const caller = appRouter.createCaller({ db, user: null });
    const result = await caller.upgradeLimits.getUpgradeLimitStatus({
      filterTeam: 'Test Team',
      filterStatus: 'all',
      filterType: 'all',
    });

    const testPlayer = result.players.find((p: any) => p.id === testPlayerId);
    
    const strength = testPlayer.sevenGameByAttribute.find((a: any) => a.attribute === 'Strength');
    expect(strength.used).toBe(5);
    expect(strength.remaining).toBe(1);
    expect(strength.status).toBe('near_cap');

    // Overall status should be 'near_cap'
    expect(testPlayer.sevenGameStatus).toBe('near_cap');
  });
});
