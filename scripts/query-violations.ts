import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  // Query upgrade violations table structure
  const rows = await db.execute(sql`
    SELECT * FROM upgrade_violations 
    LIMIT 10
  `);

  console.log('PLAYER_NOT_FOUND violations:');
  console.log(JSON.stringify(rows, null, 2));
  
  process.exit(0);
}

main().catch(console.error);
