import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

const db = await getDb();
const INSTANCE_ID = 'test_' + Math.random().toString(36).substring(7);

try {
  console.log('Testing lock acquisition with instance:', INSTANCE_ID);
  
  // Clear existing lock
  const clearResult = await db.execute(sql`DELETE FROM bot_instance_lock WHERE id = 1`);
  console.log('Clear result:', clearResult);
  
  // Try to insert
  const expiresAt = new Date(Date.now() + 60000);
  const expiryTimestamp = Math.floor(expiresAt.getTime() / 1000);
  
  console.log('Attempting INSERT with timestamp:', expiryTimestamp);
  const insertResult = await db.execute(sql`
    INSERT INTO bot_instance_lock (id, instanceId, expiresAt)
    VALUES (1, ${INSTANCE_ID}, FROM_UNIXTIME(${expiryTimestamp}))
  `);
  
  console.log('Insert result type:', typeof insertResult);
  console.log('Insert result is array:', Array.isArray(insertResult));
  if (Array.isArray(insertResult)) {
    console.log('Result[0]:', insertResult[0]);
    console.log('Result[0].affectedRows:', insertResult[0]?.affectedRows);
  }
  
  // Check what's in the table
  const checkResult = await db.execute(sql`SELECT * FROM bot_instance_lock WHERE id = 1`);
  console.log('Check result:', checkResult);
  
  // Try to update
  console.log('\nAttempting UPDATE...');
  const updateResult = await db.execute(sql`
    UPDATE bot_instance_lock
    SET expiresAt = FROM_UNIXTIME(${expiryTimestamp}), lockedAt = NOW()
    WHERE id = 1 AND instanceId = ${INSTANCE_ID}
  `);
  
  console.log('Update result type:', typeof updateResult);
  if (Array.isArray(updateResult)) {
    console.log('Result[0]:', updateResult[0]);
    console.log('Result[0].affectedRows:', updateResult[0]?.affectedRows);
  }
  
} catch (err: any) {
  console.error('Error:', err.message);
  console.error('Code:', err.code);
}
process.exit(0);
