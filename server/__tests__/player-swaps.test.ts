import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import { playerSwaps } from '../../drizzle/schema';

describe('Player Swaps API', () => {
  let caller: any;

  beforeAll(async () => {
    // Create a mock context with admin user
    const mockContext = {
      user: {
        id: 1,
        name: 'Test Admin',
        openId: 'test-admin',
        role: 'admin' as const,
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
  });

  it('should get empty stats initially', async () => {
    const stats = await caller.playerSwaps.getStats();
    
    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.dnaSwaps).toBeGreaterThanOrEqual(0);
    expect(stats.playerReplacements).toBeGreaterThanOrEqual(0);
    expect(stats.other).toBeGreaterThanOrEqual(0);
    expect(stats.flagged).toBeGreaterThanOrEqual(0);
  });

  it('should create a new player swap', async () => {
    const result = await caller.playerSwaps.create({
      oldPlayerName: 'Test Player Old',
      newPlayerName: 'Test Player New',
      team: 'Test Team',
      swapType: 'dna_swap' as const,
      swapDate: '11/30/2025',
      oldPlayerOvr: 85,
      newPlayerOvr: 87,
      notes: 'Test swap for vitest',
      flagged: false,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });

  it('should get all player swaps', async () => {
    const swaps = await caller.playerSwaps.getAll({});
    
    expect(Array.isArray(swaps)).toBe(true);
    expect(swaps.length).toBeGreaterThan(0);
    
    const testSwap = swaps.find((s: any) => s.oldPlayerName === 'Test Player Old');
    expect(testSwap).toBeDefined();
    expect(testSwap.newPlayerName).toBe('Test Player New');
    expect(testSwap.swapType).toBe('dna_swap');
  });

  it('should filter swaps by type', async () => {
    const dnaSwaps = await caller.playerSwaps.getAll({
      swapType: 'dna_swap' as const,
    });

    expect(Array.isArray(dnaSwaps)).toBe(true);
    dnaSwaps.forEach((swap: any) => {
      expect(swap.swapType).toBe('dna_swap');
    });
  });

  it('should search swaps by player name', async () => {
    const results = await caller.playerSwaps.getAll({
      search: 'Test Player',
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should update a player swap', async () => {
    const swaps = await caller.playerSwaps.getAll({});
    const testSwap = swaps.find((s: any) => s.oldPlayerName === 'Test Player Old');
    
    if (testSwap) {
      const result = await caller.playerSwaps.update({
        id: testSwap.id,
        notes: 'Updated notes for test',
        flagged: true,
        flagReason: 'Test flag reason',
      });

      expect(result.success).toBe(true);

      const updated = await caller.playerSwaps.getById({ id: testSwap.id });
      expect(updated.notes).toBe('Updated notes for test');
      expect(updated.flagged).toBe(1);
      expect(updated.flagReason).toBe('Test flag reason');
    }
  });

  it('should toggle flag status', async () => {
    const swaps = await caller.playerSwaps.getAll({});
    const testSwap = swaps.find((s: any) => s.oldPlayerName === 'Test Player Old');
    
    if (testSwap) {
      const result = await caller.playerSwaps.toggleFlag({
        id: testSwap.id,
        flagged: false,
      });

      expect(result.success).toBe(true);

      const updated = await caller.playerSwaps.getById({ id: testSwap.id });
      expect(updated.flagged).toBe(0);
    }
  });

  it('should delete a player swap', async () => {
    const swaps = await caller.playerSwaps.getAll({});
    const testSwap = swaps.find((s: any) => s.oldPlayerName === 'Test Player Old');
    
    if (testSwap) {
      const result = await caller.playerSwaps.delete({ id: testSwap.id });
      expect(result.success).toBe(true);

      const afterDelete = await caller.playerSwaps.getAll({});
      const deleted = afterDelete.find((s: any) => s.id === testSwap.id);
      expect(deleted).toBeUndefined();
    }
  });

  it('should bulk import player swaps', async () => {
    const result = await caller.playerSwaps.bulkImport({
      swaps: [
        {
          oldPlayerName: 'Bulk Player 1',
          newPlayerName: 'Bulk Player 1 New',
          team: 'Bulk Team',
          swapType: 'player_replacement' as const,
          swapDate: '11/30/2025',
          oldPlayerOvr: 80,
          newPlayerOvr: 82,
        },
        {
          oldPlayerName: 'Bulk Player 2',
          newPlayerName: 'Bulk Player 2 New',
          swapType: 'other' as const,
          swapDate: '11/30/2025',
        },
      ],
    });

    expect(result.imported).toBe(2);

    // Clean up bulk imports
    const db = await getDb();
    if (db) {
      const { like } = await import('drizzle-orm');
      await db.delete(playerSwaps).where(
        like(playerSwaps.oldPlayerName, 'Bulk Player%')
      );
    }
  });
});
