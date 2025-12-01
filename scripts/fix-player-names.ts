import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('=== Fixing PLAYER_NOT_FOUND Violations ===\n');

  // Step 1: Add Egor Demin to Magic roster
  console.log('1. Adding Egor Demin to Magic...');
  await db.execute(sql`
    INSERT INTO players (id, name, team, overall, isRookie, draftYear, source)
    VALUES ('P0999', 'Egor Demin', 'Magic', 75, 1, 2025, 'manual')
    ON DUPLICATE KEY UPDATE team = 'Magic'
  `);
  console.log('   ✓ Egor Demin added\n');

  // Step 2: Create player_aliases for common name variations
  console.log('2. Creating player name aliases...');
  
  const aliases = [
    // Terrence Shannon Jr variations
    { playerId: 'P0315', playerName: 'Terrence Shannon Jr', alias: 'Terrence Shannon Jr.' },
    { playerId: 'P0315', playerName: 'Terrence Shannon Jr', alias: 'Terrence Shannon' },
    { playerId: 'P0315', playerName: 'Terrence Shannon Jr', alias: 'Shannon Jr.' },
    { playerId: 'P0315', playerName: 'Terrence Shannon Jr', alias: 'Shannon' },
    
    // Jaren Jackson Jr variations
    { playerId: 'P0314', playerName: 'Jaren Jackson Jr', alias: 'Jaren Jackson Jr.' },
    { playerId: 'P0314', playerName: 'Jaren Jackson Jr', alias: 'Jaren Jackson' },
    { playerId: 'P0314', playerName: 'Jaren Jackson Jr', alias: 'Jackson Jr.' },
    
    // Lu Dort variations
    { playerId: 'P0145', playerName: 'Luguentz Dort', alias: 'Lu Dort' },
    { playerId: 'P0145', playerName: 'Luguentz Dort', alias: 'Dort' },
    
    // Michael Porter Jr variations
    { playerId: 'P0309', playerName: 'Michael Porter Jr', alias: 'Michael Porter Jr.' },
    { playerId: 'P0309', playerName: 'Michael Porter Jr', alias: 'Michael Porter' },
    { playerId: 'P0309', playerName: 'Michael Porter Jr', alias: 'Porter Jr.' },
    
    // Tim Hardaway Jr variations
    { playerId: 'P0317', playerName: 'Tim Hardaway Jr.', alias: 'Tim Hardaway Jr' },
    { playerId: 'P0317', playerName: 'Tim Hardaway Jr.', alias: 'Tim Hardaway' },
    { playerId: 'P0317', playerName: 'Tim Hardaway Jr.', alias: 'Hardaway Jr.' },
    
    // Last name only aliases
    { playerId: 'P0606', playerName: 'Jamir Watkins', alias: 'Watkins' },
    { playerId: 'P0492', playerName: 'Will Richard', alias: 'Richard' },
    { playerId: 'P0483', playerName: 'Maxime Raynaud', alias: 'Raynaud' },
    
    // Egor Demin variations
    { playerId: 'P0999', playerName: 'Egor Demin', alias: 'Egor Demin' },
    { playerId: 'P0999', playerName: 'Egor Demin', alias: 'Demin' },
  ];

  for (const { playerId, playerName, alias } of aliases) {
    await db.execute(sql`
      INSERT INTO player_aliases (playerId, playerName, alias)
      VALUES (${playerId}, ${playerName}, ${alias})
      ON DUPLICATE KEY UPDATE alias = alias
    `);
    console.log(`   ✓ Added alias "${alias}" → ${playerName} (${playerId})`);
  }

  console.log('\n3. Summary:');
  console.log('   - Added Egor Demin to Magic roster');
  console.log(`   - Created ${aliases.length} player name aliases`);
  console.log('   - Terrence Shannon Jr. already exists in Raptors roster');
  
  console.log('\n✅ All fixes applied successfully!');
  console.log('\nNext step: Re-run the upgrade compliance audit to verify resolution');

  process.exit(0);
}

main().catch(console.error);
