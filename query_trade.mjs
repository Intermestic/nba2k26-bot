import { getDb } from './server/db.js';
import { trades } from './drizzle/schema.js';
import { or, eq } from 'drizzle-orm';

const db = await getDb();

const results = await db.select().from(trades).where(
  or(eq(trades.team1, 'Spurs'), eq(trades.team2, 'Spurs'))
).orderBy(trades.createdAt).limit(5);

console.log('Spurs trades:');
results.forEach(trade => {
  console.log(`\nMessage ID: ${trade.messageId}`);
  console.log(`Teams: ${trade.team1} ↔ ${trade.team2}`);
  console.log(`Status: ${trade.status}`);
  console.log(`Created: ${trade.createdAt}`);
});

process.exit(0);
