import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { players } from './drizzle/schema.js';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client);

const results = await db.execute(sql`SELECT id, name, team, overall FROM players WHERE LOWER(name) LIKE '%sarr%' OR LOWER(name) LIKE '%richards%' OR LOWER(name) LIKE '%berringer%' ORDER BY name`);

console.log('Found players:');
console.log(JSON.stringify(results.rows, null, 2));

// Also check for the specific trade players
const tradePlayerNames = [
  'Anthony Davis',
  'Rasheer Fleming', 
  'Jase Richards',
  'Josh Giddey',
  'Alexander Sarr',
  'Joan Berringer'
];

console.log('\n\nChecking specific trade players:');
for (const name of tradePlayerNames) {
  const result = await db.execute(sql`SELECT id, name, team, overall FROM players WHERE LOWER(name) = LOWER(${name})`);
  if (result.rows.length > 0) {
    console.log(`✓ ${name}: ${result.rows[0].team} (${result.rows[0].overall} OVR)`);
  } else {
    console.log(`✗ ${name}: NOT FOUND`);
  }
}

process.exit(0);
