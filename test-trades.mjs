import { getDb } from './server/db.js';
import { trades } from './drizzle/schema.js';
import { sql } from 'drizzle-orm';

const db = await getDb();
const results = await db.select().from(trades).where(
  sql`team1 LIKE '%Cav%' OR team2 LIKE '%Cav%' OR team1 LIKE '%Trail%' OR team2 LIKE '%Trail%'`
);

console.log('Found', results.length, 'trades:');
results.forEach(t => {
  console.log('ID:', t.id);
  console.log('Team1:', JSON.stringify(t.team1));
  console.log('Team2:', JSON.stringify(t.team2));
  console.log('Status:', t.status);
  console.log('MessageId:', t.messageId);
  console.log('---');
});
process.exit(0);
