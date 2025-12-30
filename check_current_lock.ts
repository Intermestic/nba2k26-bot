import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

const db = await getDb();
try {
  const result = await db.execute(sql`SELECT * FROM bot_instance_lock WHERE id = 1`);
  const rows = Array.isArray(result) ? result[0] : result;
  console.log('Current lock:', rows);
} catch (err: any) {
  console.error('Error:', err.message);
}
process.exit(0);
