import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { trades } from './drizzle/schema.js';

const sqlite = new Database('./data.db');
const db = drizzle(sqlite);

// Trade 1: Lakers/Celtics
const trade1 = {
  messageId: '1334363556890435584', // You'll need to provide the actual message ID
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

// Trade 2: Bucks/Pacers
const trade2 = {
  messageId: '1334363682569809930', // You'll need to provide the actual message ID
  team1: 'Bucks',
  team2: 'Pacers',
  team1Players: JSON.stringify([
    { name: 'Naz Reid', overall: 82, salary: 18 },
    { name: 'Thomas Sorber', overall: 71, salary: 1 }
  ]),
  team2Players: JSON.stringify([
    { name: 'Jaime Jaquez Jr', overall: 80, salary: 9 },
    { name: 'Kyle Kuzma', overall: 77, salary: 14 }
  ]),
  status: 'approved',
  upvotes: 7,
  downvotes: 1,
  approvedBy: 'Discord Vote',
  processedAt: new Date()
};

console.log('Inserting missing trade records...\n');

try {
  console.log('Trade 1: Lakers ↔ Celtics');
  console.log('  Lakers send: Adou Thiero (70 OVR, 5M)');
  console.log('  Celtics send: Colin Castleton (70 OVR, 3M)');
  console.log('  Message ID:', trade1.messageId);
  
  // Check if trade already exists
  const existing1 = db.select().from(trades).where(trades.messageId.eq(trade1.messageId)).all();
  if (existing1.length > 0) {
    console.log('  ⚠️  Trade already exists in database, skipping\n');
  } else {
    await db.insert(trades).values(trade1);
    console.log('  ✅ Inserted successfully\n');
  }
  
  console.log('Trade 2: Bucks ↔ Pacers');
  console.log('  Bucks send: Naz Reid (82 OVR, 18M), Thomas Sorber (71 OVR, 1M)');
  console.log('  Pacers send: Jaime Jaquez Jr (80 OVR, 9M), Kyle Kuzma (77 OVR, 14M)');
  console.log('  Message ID:', trade2.messageId);
  
  // Check if trade already exists
  const existing2 = db.select().from(trades).where(trades.messageId.eq(trade2.messageId)).all();
  if (existing2.length > 0) {
    console.log('  ⚠️  Trade already exists in database, skipping\n');
  } else {
    await db.insert(trades).values(trade2);
    console.log('  ✅ Inserted successfully\n');
  }
  
  console.log('✅ Done! Both trade records have been added to the database.');
  console.log('\nNext steps:');
  console.log('1. Go to Discord and find the approval messages for these trades');
  console.log('2. Add a ⚡ reaction to each approval message');
  console.log('3. The bot will process the trades and update player teams');
  
} catch (error) {
  console.error('❌ Error inserting trades:', error);
} finally {
  sqlite.close();
}
