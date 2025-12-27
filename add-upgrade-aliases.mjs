import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Mapping of upgrade_log names to correct player IDs/names
const aliasMap = [
  // Jr. suffix differences (period)
  { alias: 'Jaren Jackson Jr.', correctName: 'Jaren Jackson Jr' },
  { alias: 'Larry Nance Jr.', correctName: 'Larry Nance Jr' },
  { alias: 'Michael Porter Jr.', correctName: 'Michael Porter Jr' },
  { alias: 'Terrence Shannon Jr.', correctName: 'Terrence Shannon Jr' },
  
  // Name abbreviations (periods)
  { alias: 'PJ Washington', correctName: 'P.J. Washington' },
  { alias: 'RJ Barrett', correctName: 'R.J. Barrett' },
  
  // Nickname variations
  { alias: 'Lu Dort', correctName: 'Luguentz Dort' },
  { alias: 'Alperen Sengun', correctName: 'Alperen Şengün' }, // Turkish character
  
  // First name only - need to check which player
  { alias: 'Clark', correctName: 'Brandon Clarke' }, // Most likely
  { alias: 'Cooper', correctName: 'Cooper Flagg' }, // Most likely
  { alias: 'Zach', correctName: 'Zach Edey' }, // Need to check
  { alias: 'Richard', correctName: 'Nick Richards' }, // Need to check
  { alias: 'Watkins', correctName: 'Jamir Watkins' },
  { alias: 'Berringer', correctName: 'Berringer' }, // Need to find
  { alias: 'Raynaud', correctName: 'Maxime Raynaud' },
  
  // Special cases
  { alias: 'Egor Demin', correctName: 'Egor Demin' }, // Might be exact match issue
  { alias: 'Tristan Vukcevic', correctName: 'Tristan Vukčević' }, // Special character
  { alias: "De'Aaron Fox", correctName: "De'Aaron Fox" }, // Apostrophe issue
];

console.log('Adding aliases for mismatched player names...\n');

for (const { alias, correctName } of aliasMap) {
  // Find the player by correct name
  const playerResult = await db.execute(sql`
    SELECT id, name FROM players WHERE name = ${correctName} LIMIT 1
  `);
  
  if (playerResult[0].length === 0) {
    console.log(`⚠️  Player not found: "${correctName}" (alias: "${alias}")`);
    continue;
  }
  
  const player = playerResult[0][0];
  
  // Check if alias already exists
  const existingAlias = await db.execute(sql`
    SELECT id FROM player_aliases WHERE playerId = ${player.id} AND alias = ${alias}
  `);
  
  if (existingAlias[0].length > 0) {
    console.log(`✓  Alias already exists: "${alias}" → ${correctName}`);
    continue;
  }
  
  // Insert the alias
  await db.execute(sql`
    INSERT INTO player_aliases (playerId, playerName, alias, matchCount, addedBy, addedByName, createdAt, updatedAt)
    VALUES (${player.id}, ${player.name}, ${alias}, 0, NULL, 'System', NOW(), NOW())
  `);
  
  console.log(`✓  Added alias: "${alias}" → ${correctName} (ID: ${player.id})`);
}

console.log('\n✅ Alias addition complete!');

await connection.end();
