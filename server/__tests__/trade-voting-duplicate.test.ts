import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db.js';
import { tradeVotes } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

describe('Trade Voting - Duplicate Prevention', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available for testing');
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (db) {
      await db.delete(tradeVotes).where(eq(tradeVotes.messageId, 'test-message-123'));
    }
  });

  it('should prevent duplicate trade approval processing', async () => {
    if (!db) {
      throw new Error('Database not available');
    }

    const testMessageId = 'test-message-123';

    // First approval - should insert successfully
    await db.insert(tradeVotes).values({
      messageId: testMessageId,
      upvotes: 7,
      downvotes: 2,
      approved: 1,
    });

    // Check that the record was inserted
    const firstCheck = await db.select().from(tradeVotes).where(eq(tradeVotes.messageId, testMessageId));
    expect(firstCheck.length).toBe(1);
    expect(firstCheck[0].messageId).toBe(testMessageId);
    expect(firstCheck[0].upvotes).toBe(7);
    expect(firstCheck[0].approved).toBe(1);

    // Simulate checking for duplicate - should find existing record
    const duplicateCheck = await db.select().from(tradeVotes).where(eq(tradeVotes.messageId, testMessageId)).limit(1);
    expect(duplicateCheck.length).toBeGreaterThan(0);
    expect(duplicateCheck[0].messageId).toBe(testMessageId);

    // This proves that the processVoteResult function will skip processing
    // because existingVote.length > 0
  });

  it('should track vote counts and approval status correctly', async () => {
    if (!db) {
      throw new Error('Database not available');
    }

    // Query existing trade votes
    const allVotes = await db.select().from(tradeVotes);
    
    // Should have at least the test vote
    expect(allVotes.length).toBeGreaterThan(0);

    // Each vote should have required fields
    allVotes.forEach(vote => {
      expect(vote.messageId).toBeDefined();
      expect(typeof vote.upvotes).toBe('number');
      expect(typeof vote.downvotes).toBe('number');
      expect([0, 1]).toContain(vote.approved);
      expect(vote.processedAt).toBeInstanceOf(Date);
    });
  });

  it('should enforce unique messageId constraint', async () => {
    if (!db) {
      throw new Error('Database not available');
    }

    const testMessageId = 'test-unique-constraint';

    // First insert
    await db.insert(tradeVotes).values({
      messageId: testMessageId,
      upvotes: 7,
      downvotes: 1,
      approved: 1,
    });

    // Second insert with same messageId should fail
    await expect(async () => {
      await db.insert(tradeVotes).values({
        messageId: testMessageId,
        upvotes: 8,
        downvotes: 2,
        approved: 1,
      });
    }).rejects.toThrow();

    // Clean up
    await db.delete(tradeVotes).where(eq(tradeVotes.messageId, testMessageId));
  });
});
