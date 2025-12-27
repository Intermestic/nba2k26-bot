import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { trades } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const sqlite = new Database('./data.db');
const db = drizzle(sqlite);

// Lakers/Celtics trade - Message ID from Discord
const trade = {
  messageId: '1445572808511062090',
  team1: 'Lakers',
  team2: 'Celtics',
  team1Players: JSON.stringify([
    { name: 'Adou Thiero', overall: 70, salary: 5 }
  ]),
  team2Players: JSON.stringify([
    { name: 'Colin Castleton', overall: 70, salary: 3 }
  ]),
  status: 'approved',
  upvotes: 7,
  downvotes: 1,
  approvedBy: 'Discord Vote',
  processedAt: new Date()
};

console.log('Inserting Lakers ↔ Celtics trade record...\n');
console.log('Trade Details:');
console.log('  Lakers send: Adou Thiero (70 OVR, 5M)');
console.log('  Celtics send: Colin Castleton (70 OVR, 3M)');
console.log('  Status: Approved (7 👍, 1 👎)');
console.log('  Message ID:', trade.messageId);
console.log('');

try {
  // Check if trade already exists
  const existing = db.select().from(trades).where(eq(trades.messageId, trade.messageId)).all();
  
  if (existing.length > 0) {
    console.log('⚠️  Trade record already exists in database!');
    console.log('    Created at:', existing[0].createdAt);
    console.log('    Status:', existing[0].status);
    console.log('\nNo action needed - you can now add ⚡ reaction to process the trade.');
  } else {
    await db.insert(trades).values(trade);
    console.log('✅ Trade record inserted successfully!\n');
    console.log('Next steps:');
    console.log('1. Go to Discord and find the "✅ Trade Approved" message');
    console.log('2. Add a ⚡ (bolt) reaction to that message');
    console.log('3. The bot will process the trade and update player teams');
  }
  
} catch (error) {
  console.error('❌ Error inserting trade:', error);
  console.error('\nError details:', error.message);
} finally {
  sqlite.close();
}
