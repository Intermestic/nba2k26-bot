import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Clear all locks
await db.execute(`DELETE FROM bot_instance_lock`);
console.log('✅ All bot instance locks cleared');

await pool.end();
