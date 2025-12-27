import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { tradeVotes, trades } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const messageId = '1449814470850383884';

console.log('Checking trade votes for message:', messageId);
const voteRecords = await db.select().from(tradeVotes).where(eq(tradeVotes.messageId, messageId));
console.log('Vote records:', JSON.stringify(voteRecords, null, 2));

console.log('\nChecking trade records for message:', messageId);
const tradeRecords = await db.select().from(trades).where(eq(trades.messageId, messageId));
console.log('Trade records:', JSON.stringify(tradeRecords, null, 2));

await connection.end();
