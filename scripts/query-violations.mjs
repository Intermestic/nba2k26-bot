import { db } from '../server/db.ts';
import { sql } from 'drizzle-orm';

// Query upgrade violations
const rows = await db.execute(sql`
  SELECT * FROM upgrade_violations 
  WHERE violation_type = 'PLAYER_NOT_FOUND' 
  LIMIT 20
`);

console.log('PLAYER_NOT_FOUND violations:');
console.log(JSON.stringify(rows, null, 2));

process.exit(0);
