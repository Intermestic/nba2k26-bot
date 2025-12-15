import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const result = await db.execute(`SELECT * FROM bot_instance_lock ORDER BY acquired_at DESC LIMIT 5`);
console.log('Bot instance locks:');
console.log(JSON.stringify(result.rows, null, 2));

await pool.end();
