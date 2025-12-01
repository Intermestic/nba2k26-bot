import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('=== Adding Remaining Player Aliases ===\n');

  // First, search for the remaining players
  console.log('1. Searching for remaining players...\n');
  
  const searches = [
    { name: 'Larry Nance', search: '%Nance%' },
    { name: 'Alperen Sengun', search: '%Sengun%' },
    { name: 'RJ Barrett', search: '%Barrett%' },
    { name: 'Kristaps Porzingis', search: '%Porzingis%' },
    { name: 'PJ Washington', search: '%Washington%' },
    { name: 'Berringer', search: '%Berringer%' },
  ];

  const foundPlayers: Array<{ id: string; name: string; searchTerm: string }> = [];

  for (const { name, search } of searches) {
    const results = await db.execute(sql`
      SELECT id, name, team 
      FROM players 
      WHERE name LIKE ${search}
      LIMIT 3
    `);
    
    console.log(`Search "${name}":`, results[0]);
    if (results[0] && Array.isArray(results[0]) && results[0].length > 0) {
      foundPlayers.push({ id: results[0][0].id, name: results[0][0].name, searchTerm: name });
    }
  }

  // Add aliases for found players
  console.log('\n2. Adding aliases for found players...\n');
  
  const newAliases = [
    // Larry Nance Jr
    { playerId: '', playerName: 'Larry Nance Jr', alias: 'Larry Nance Jr.' },
    { playerId: '', playerName: 'Larry Nance Jr', alias: 'Larry Nance' },
    { playerId: '', playerName: 'Larry Nance Jr', alias: 'Nance Jr.' },
    
    // Alperen Sengun (with special character)
    { playerId: '', playerName: 'Alperen Şengün', alias: 'Alperen Sengun' },
    { playerId: '', playerName: 'Alperen Şengün', alias: 'Sengun' },
    
    // RJ Barrett
    { playerId: '', playerName: 'RJ Barrett', alias: 'RJ Barrett' },
    { playerId: '', playerName: 'RJ Barrett', alias: 'Barrett' },
    
    // Kristaps Porzingis
    { playerId: '', playerName: 'Kristaps Porziņģis', alias: 'Kristaps Porzingis' },
    { playerId: '', playerName: 'Kristaps Porziņģis', alias: 'Porzingis' },
    
    // PJ Washington
    { playerId: '', playerName: 'PJ Washington', alias: 'PJ Washington' },
    { playerId: '', playerName: 'PJ Washington', alias: 'Washington' },
    
    // Tristan Vukcevic (with special character)
    { playerId: '', playerName: 'Tristan Vukčević', alias: 'Tristan Vukcevic' },
    { playerId: '', playerName: 'Tristan Vukčević', alias: 'Vukcevic' },
    
    // Cooper Flagg
    { playerId: 'P0175', playerName: 'Cooper Flagg', alias: 'Cooper' },
    
    // Ambiguous last names - need context from upgrade log to determine which player
    // For now, add most likely candidates based on team activity
  ];

  // Update player IDs based on search results
  for (const found of foundPlayers) {
    for (const alias of newAliases) {
      if (alias.playerName.includes(found.searchTerm)) {
        alias.playerId = found.id;
      }
    }
  }

  // Manually set known player IDs
  const manualIds = [
    { search: 'Tristan Vukčević', id: '' }, // Need to find this
    { search: 'Cooper Flagg', id: 'P0175' },
  ];

  // Search for Tristan Vukcevic
  const vukcevic = await db.execute(sql`
    SELECT id, name FROM players WHERE name LIKE '%Vuk%' LIMIT 3
  `);
  console.log('Tristan Vukcevic search:', vukcevic[0]);

  // Search for RJ Barrett
  const rj = await db.execute(sql`
    SELECT id, name FROM players WHERE name LIKE '%Barrett%' LIMIT 3
  `);
  console.log('RJ Barrett search:', rj[0]);

  // Search for Alperen Sengun
  const sengun = await db.execute(sql`
    SELECT id, name FROM players WHERE name LIKE '%eng%' LIMIT 5
  `);
  console.log('Alperen Sengun search:', sengun[0]);

  // Search for Kristaps
  const kp = await db.execute(sql`
    SELECT id, name FROM players WHERE name LIKE '%Porz%' LIMIT 3
  `);
  console.log('Kristaps Porzingis search:', kp[0]);

  // Search for PJ Washington
  const pj = await db.execute(sql`
    SELECT id, name FROM players WHERE name = 'PJ Washington' LIMIT 1
  `);
  console.log('PJ Washington search:', pj[0]);

  // Search for Larry Nance
  const nance = await db.execute(sql`
    SELECT id, name FROM players WHERE name LIKE '%Nance%' LIMIT 3
  `);
  console.log('Larry Nance Jr search:', nance[0]);

  console.log('\n✅ Search complete. Now manually adding aliases based on results...');

  process.exit(0);
}

main().catch(console.error);
