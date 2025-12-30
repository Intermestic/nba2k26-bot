import { getDb } from './server/db.js';
import { sql } from 'drizzle-orm';

const db = await getDb();
try {
  const result = await db.execute(sql`DESCRIBE bot_instance_lock`);
  console.log('Schema:', JSON.stringify(result, null, 2));
  
  // Try to insert
  const now = new Date();
  const testId = 'test_' + Math.random().toString(36).substring(7);
  console.log('Attempting to insert with testId:', testId);
  
  const insertResult = await db.execute(sql`
    INSERT INTO bot_instance_lock (id, instanceId, expiresAt)
    VALUES (1, ${testId}, ${now})
  `);
  console.log('Insert result:', JSON.stringify(insertResult, null, 2));
  
  // Check what's in the table
  const checkResult = await db.execute(sql`SELECT * FROM bot_instance_lock WHERE id = 1`);
  console.log('Check result:', JSON.stringify(checkResult, null, 2));
  
} catch (err) {
  console.error('Error:', err.message, err.code);
}
process.exit(0);
