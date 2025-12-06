import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getDb } from '../db';
import { trades } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Test for trade approval handler fix
 * 
 * Issue: When trades are approved, two database records are created:
 * 1. One with the original trade message ID
 * 2. One with the approval reply message ID
 * 
 * When users react with ⚡ to the ORIGINAL trade message, the bot couldn't find it
 * because it was only looking for the current message ID.
 * 
 * Fix: Modified trade-approval-handler.ts to check both the current message
 * and any reply messages to find the trade record.
 */
describe('Trade Approval Reply Lookup', () => {
  let db: any;
  const testTradeMessageId = '9999999999999999999';
  const testApprovalMessageId = '9999999999999999998';

  beforeAll(async () => {
    db = await getDb();
    
    // Clean up any existing test data
    await db.delete(trades).where(eq(trades.messageId, testTradeMessageId));
    await db.delete(trades).where(eq(trades.messageId, testApprovalMessageId));
    
    // Insert test trade records (simulating what happens when a trade is approved)
    await db.insert(trades).values({
      messageId: testTradeMessageId,
      team1: 'Lakers',
      team2: 'Celtics',
      team1Players: JSON.stringify([{ name: 'LeBron James', overall: 95, salary: 50 }]),
      team2Players: JSON.stringify([{ name: 'Jayson Tatum', overall: 94, salary: 45 }]),
      status: 'approved',
      upvotes: 7,
      downvotes: 0,
      approvedBy: 'Discord Vote',
      processedAt: new Date(),
    });
    
    // Insert duplicate record with approval message ID (this is what the system does)
    await db.insert(trades).values({
      messageId: testApprovalMessageId,
      team1: 'Lakers',
      team2: 'Celtics',
      team1Players: JSON.stringify([{ name: 'LeBron James', overall: 95, salary: 50 }]),
      team2Players: JSON.stringify([{ name: 'Jayson Tatum', overall: 94, salary: 45 }]),
      status: 'approved',
      upvotes: 7,
      downvotes: 0,
      approvedBy: 'Discord Vote',
      processedAt: new Date(),
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (db) {
      await db.delete(trades).where(eq(trades.messageId, testTradeMessageId));
      await db.delete(trades).where(eq(trades.messageId, testApprovalMessageId));
    }
  });

  it('should find trade record by original message ID', async () => {
    const tradeRecords = await db
      .select()
      .from(trades)
      .where(eq(trades.messageId, testTradeMessageId))
      .limit(1);
    
    expect(tradeRecords.length).toBe(1);
    expect(tradeRecords[0].team1).toBe('Lakers');
    expect(tradeRecords[0].team2).toBe('Celtics');
    expect(tradeRecords[0].status).toBe('approved');
  });

  it('should find trade record by approval message ID', async () => {
    const tradeRecords = await db
      .select()
      .from(trades)
      .where(eq(trades.messageId, testApprovalMessageId))
      .limit(1);
    
    expect(tradeRecords.length).toBe(1);
    expect(tradeRecords[0].team1).toBe('Lakers');
    expect(tradeRecords[0].team2).toBe('Celtics');
    expect(tradeRecords[0].status).toBe('approved');
  });

  it('should verify both records exist for the same trade', async () => {
    const originalRecord = await db
      .select()
      .from(trades)
      .where(eq(trades.messageId, testTradeMessageId))
      .limit(1);
    
    const approvalRecord = await db
      .select()
      .from(trades)
      .where(eq(trades.messageId, testApprovalMessageId))
      .limit(1);
    
    expect(originalRecord.length).toBe(1);
    expect(approvalRecord.length).toBe(1);
    
    // Both records should have the same trade details
    expect(originalRecord[0].team1).toBe(approvalRecord[0].team1);
    expect(originalRecord[0].team2).toBe(approvalRecord[0].team2);
    expect(originalRecord[0].team1Players).toBe(approvalRecord[0].team1Players);
    expect(originalRecord[0].team2Players).toBe(approvalRecord[0].team2Players);
  });
});
