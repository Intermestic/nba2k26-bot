import { Router } from 'express';
import { getDb } from '../db';
import { faTransactions } from '../../drizzle/schema';
import { desc } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/fa-transactions
 * Get all FA transactions with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    // Get all transactions, ordered by most recent first
    const transactions = await db
      .select()
      .from(faTransactions)
      .orderBy(desc(faTransactions.processedAt));
    
    res.json(transactions);
  } catch (error) {
    console.error('[FA Transactions API] Error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/fa-transactions/:batchId
 * Get all transactions for a specific batch
 */
router.get('/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const { eq } = await import('drizzle-orm');
    
    const transactions = await db
      .select()
      .from(faTransactions)
      .where(eq(faTransactions.batchId, batchId))
      .orderBy(desc(faTransactions.processedAt));
    
    res.json(transactions);
  } catch (error) {
    console.error('[FA Transactions API] Error:', error);
    res.status(500).json({ error: 'Failed to fetch batch transactions' });
  }
});

export default router;
