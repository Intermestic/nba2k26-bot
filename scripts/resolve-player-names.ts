import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('=== Finding Players with Name Variations ===\n');

  // List of players to search for
  const searchNames = [
    'Egor Demin',
    'Terrence Shannon',
    'Jaren Jackson',
    'RJ Barrett',
    'Dort',
    'Sengun',
    'Michael Porter',
    'Tim Hardaway',
    'Vukcevic',
    'Watkins',
    'Zach',
    'Clark',
    'Richard',
    'Raynaud',
    'Cooper',
    'Berringer'
  ];

  for (const searchName of searchNames) {
    const results = await db.execute(sql`
      SELECT id, name, team 
      FROM players 
      WHERE name LIKE ${`%${searchName}%`}
      LIMIT 5
    `);
    
    console.log(`\nSearch: "${searchName}"`);
    console.log(JSON.stringify(results[0], null, 2));
  }

  // Check if Egor Demin exists
  console.log('\n\n=== Checking Specific Players ===\n');
  
  const demin = await db.execute(sql`
    SELECT id, name, team 
    FROM players 
    WHERE name = 'Egor Demin'
  `);
  console.log('Egor Demin:', JSON.stringify(demin[0], null, 2));

  const shannon = await db.execute(sql`
    SELECT id, name, team 
    FROM players 
    WHERE name LIKE '%Shannon%'
  `);
  console.log('\nTerrence Shannon:', JSON.stringify(shannon[0], null, 2));

  process.exit(0);
}

main().catch(console.error);
