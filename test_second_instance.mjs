import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(connection);

// Simulate a second instance trying to acquire lock
const INSTANCE_ID = 'test-second-instance';
const expiresAt = new Date(Date.now() + 60000);

console.log('Attempting to acquire lock as second instance...');

try {
  await db.execute(sql`
    INSERT INTO bot_instance_lock (id, instanceId, expiresAt)
    VALUES (1, ${INSTANCE_ID}, ${expiresAt})
  `);
  console.log('❌ UNEXPECTED: Second instance acquired lock (should have been blocked)');
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
    console.log('✅ CORRECT: Second instance blocked by duplicate key constraint');
    
    // Try to update if lock is expired (it shouldn't be)
    const result = await db.execute(sql`
      UPDATE bot_instance_lock
      SET instanceId = ${INSTANCE_ID}, lockedAt = NOW(), expiresAt = ${expiresAt}
      WHERE id = 1 AND expiresAt < NOW()
    `);
    
    if (result[0].affectedRows > 0) {
      console.log('❌ UNEXPECTED: Second instance took over expired lock');
    } else {
      console.log('✅ CORRECT: Lock is still active, second instance cannot take over');
    }
    
    // Show current lock holder
    const existing = await db.execute(sql`SELECT * FROM bot_instance_lock WHERE id = 1`);
    console.log('Current lock holder:', existing[0][0]);
  } else {
    console.error('Unexpected error:', error);
  }
}

await connection.end();
