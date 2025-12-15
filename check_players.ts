import { getDb } from './server/db';
import { players } from './drizzle/schema';
import { sql } from 'drizzle-orm';

const db = await getDb();

const problematicNames = [
  'Angelo Russell',
  'Mohammed Bamba',
  'Derrick Jones Jr.',
  'Kelly Oubre Jr.',
  'R'
];

console.log('Checking for players in database:\n');

for (const name of problematicNames) {
  // Try exact match
  const exactMatch = await db.select().from(players).where(sql`LOWER(${players.name}) = ${name.toLowerCase()}`);
  
  // Try partial match
  const partialMatch = await db.select().from(players).where(sql`LOWER(${players.name}) LIKE ${'%' + name.toLowerCase() + '%'}`);
  
  console.log(`\n"${name}":`);
  console.log(`  Exact match: ${exactMatch.length > 0 ? exactMatch[0].name : 'NOT FOUND'}`);
  console.log(`  Partial matches: ${partialMatch.map(p => p.name).join(', ') || 'NONE'}`);
}

// Check for D'Angelo Russell specifically
const dangelo = await db.select().from(players).where(sql`LOWER(${players.name}) LIKE '%russell%'`);
console.log(`\n\nAll Russell players in DB:`);
dangelo.forEach(p => console.log(`  - ${p.name} (${p.team})`));

// Check for Mo Bamba
const bamba = await db.select().from(players).where(sql`LOWER(${players.name}) LIKE '%bamba%'`);
console.log(`\nAll Bamba players in DB:`);
bamba.forEach(p => console.log(`  - ${p.name} (${p.team})`));

// Check for Jones players
const jones = await db.select().from(players).where(sql`LOWER(${players.name}) LIKE '%jones%'`);
console.log(`\nAll Jones players in DB:`);
jones.forEach(p => console.log(`  - ${p.name} (${p.team})`));

// Check for Oubre players
const oubre = await db.select().from(players).where(sql`LOWER(${players.name}) LIKE '%oubre%'`);
console.log(`\nAll Oubre players in DB:`);
oubre.forEach(p => console.log(`  - ${p.name} (${p.team})`));

process.exit(0);
