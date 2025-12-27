import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getDb } from '../db';
import { trades, players } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

describe('Trade Reversal Handler', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testTradeId: number;
  let testPlayer1Id: string;
  let testPlayer2Id: string;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test players
    testPlayer1Id = 'test-reversal-player-a';
    testPlayer2Id = 'test-reversal-player-b';
    
    await db.insert(players).values({
      id: testPlayer1Id,
      name: 'Test Player A',
      overall: 85,
      team: 'Lakers',
      height: '6-2',
      draftYear: 2020
    });

    await db.insert(players).values({
      id: testPlayer2Id,
      name: 'Test Player B',
      overall: 82,
      team: 'Celtics',
      height: '6-4',
      draftYear: 2021
    });

    // Create test trade
    const [trade] = await db.insert(trades).values({
      messageId: 'test-trade-reversal-msg-123',
      team1: 'Lakers',
      team2: 'Celtics',
      team1Players: JSON.stringify([{ name: 'Test Player A', overall: 85, salary: 5000000 }]),
      team2Players: JSON.stringify([{ name: 'Test Player B', overall: 82, salary: 4000000 }]),
      status: 'approved',
      upvotes: 7,
      downvotes: 0,
      processedAt: new Date()
    }).$returningId();
    testTradeId = trade.id;

    // Simulate trade processing - swap players
    await db.update(players).set({ team: 'Celtics' }).where(eq(players.id, testPlayer1Id));
    await db.update(players).set({ team: 'Lakers' }).where(eq(players.id, testPlayer2Id));
  });

  afterAll(async () => {
    if (!db) return;
    
    // Clean up test data
    await db.delete(trades).where(eq(trades.id, testTradeId));
    await db.delete(players).where(eq(players.id, testPlayer1Id));
    await db.delete(players).where(eq(players.id, testPlayer2Id));
  });

  it('should reverse trade and restore player teams', async () => {
    if (!db) throw new Error('Database not available');

    // Verify players are on swapped teams (after trade)
    const player1Before = await db.select().from(players).where(eq(players.id, testPlayer1Id)).limit(1);
    const player2Before = await db.select().from(players).where(eq(players.id, testPlayer2Id)).limit(1);
    
    expect(player1Before[0].team).toBe('Celtics'); // Was Lakers, now Celtics
    expect(player2Before[0].team).toBe('Lakers'); // Was Celtics, now Lakers

    // Simulate reversal logic
    const trade = await db.select().from(trades).where(eq(trades.id, testTradeId)).limit(1);
    const team1Players = JSON.parse(trade[0].team1Players) as Array<{ name: string; overall: number; salary: number }>;
    const team2Players = JSON.parse(trade[0].team2Players) as Array<{ name: string; overall: number; salary: number }>;

    // Reverse: Team1 players go back to Team1
    for (const player of team1Players) {
      const playerRecords = await db
        .select()
        .from(players)
        .where(sql`LOWER(${players.name}) = LOWER(${player.name})`)
        .limit(1);
      
      if (playerRecords.length > 0) {
        await db
          .update(players)
          .set({ team: trade[0].team1 })
          .where(eq(players.id, playerRecords[0].id));
      }
    }

    // Reverse: Team2 players go back to Team2
    for (const player of team2Players) {
      const playerRecords = await db
        .select()
        .from(players)
        .where(sql`LOWER(${players.name}) = LOWER(${player.name})`)
        .limit(1);
      
      if (playerRecords.length > 0) {
        await db
          .update(players)
          .set({ team: trade[0].team2 })
          .where(eq(players.id, playerRecords[0].id));
      }
    }

    // Update trade status
    await db
      .update(trades)
      .set({ 
        status: 'reversed',
        reversedBy: '679275787664359435',
        reversedAt: new Date()
      })
      .where(eq(trades.id, testTradeId));

    // Verify players are back on original teams
    const player1After = await db.select().from(players).where(eq(players.id, testPlayer1Id)).limit(1);
    const player2After = await db.select().from(players).where(eq(players.id, testPlayer2Id)).limit(1);
    
    expect(player1After[0].team).toBe('Lakers'); // Back to Lakers
    expect(player2After[0].team).toBe('Celtics'); // Back to Celtics

    // Verify trade status
    const tradeAfter = await db.select().from(trades).where(eq(trades.id, testTradeId)).limit(1);
    expect(tradeAfter[0].status).toBe('reversed');
    expect(tradeAfter[0].reversedBy).toBe('679275787664359435');
    expect(tradeAfter[0].reversedAt).toBeTruthy();
  });

  it('should handle case-insensitive player name lookup', async () => {
    if (!db) throw new Error('Database not available');

    // Test case-insensitive lookup
    const playerLower = await db
      .select()
      .from(players)
      .where(sql`LOWER(${players.name}) = LOWER(${'test player a'})`)
      .limit(1);
    
    expect(playerLower.length).toBe(1);
    expect(playerLower[0].name).toBe('Test Player A');

    const playerUpper = await db
      .select()
      .from(players)
      .where(sql`LOWER(${players.name}) = LOWER(${'TEST PLAYER B'})`)
      .limit(1);
    
    expect(playerUpper.length).toBe(1);
    expect(playerUpper[0].name).toBe('Test Player B');
  });
});
