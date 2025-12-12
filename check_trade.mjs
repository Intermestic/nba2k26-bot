import { getDb } from './server/db.js';
import { tradeVotes, trades } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const messageId = '1448866682893500436';
const db = await getDb();

console.log('Checking tradeVotes table...');
const votes = await db.select().from(tradeVotes).where(eq(tradeVotes.messageId, messageId));
console.log('Vote records:', JSON.stringify(votes, null, 2));

console.log('\nChecking trades table...');
const tradeRecords = await db.select().from(trades).where(eq(trades.messageId, messageId));
console.log('Trade records:', JSON.stringify(tradeRecords, null, 2));

process.exit(0);
