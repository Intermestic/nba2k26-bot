import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('=== Adding Final Player Aliases ===\n');

  const aliases = [
    // Larry Nance Jr (P0303)
    { playerId: 'P0303', playerName: 'Larry Nance Jr', alias: 'Larry Nance Jr.' },
    { playerId: 'P0303', playerName: 'Larry Nance Jr', alias: 'Larry Nance' },
    { playerId: 'P0303', playerName: 'Larry Nance Jr', alias: 'Nance Jr.' },
    { playerId: 'P0303', playerName: 'Larry Nance Jr', alias: 'Nance' },
    
    // RJ Barrett (P0032)
    { playerId: 'P0032', playerName: 'R.J. Barrett', alias: 'RJ Barrett' },
    { playerId: 'P0032', playerName: 'R.J. Barrett', alias: 'Barrett' },
    
    // Alperen Sengun (P0643)
    { playerId: 'P0643', playerName: 'Alperen Şengün', alias: 'Alperen Sengun' },
    { playerId: 'P0643', playerName: 'Alperen Şengün', alias: 'Sengun' },
    
    // Kristaps Porzingis (204001)
    { playerId: '204001', playerName: 'Kristaps Porziņģis', alias: 'Kristaps Porzingis' },
    { playerId: '204001', playerName: 'Kristaps Porziņģis', alias: 'Porzingis' },
    
    // PJ Washington (P0604)
    { playerId: 'P0604', playerName: 'P.J. Washington', alias: 'PJ Washington' },
    { playerId: 'P0604', playerName: 'P.J. Washington', alias: 'Washington' },
    
    // Tristan Vukcevic (P0592)
    { playerId: 'P0592', playerName: 'Tristan Vukčević', alias: 'Tristan Vukcevic' },
    { playerId: 'P0592', playerName: 'Tristan Vukčević', alias: 'Vukcevic' },
  ];

  for (const { playerId, playerName, alias } of aliases) {
    await db.execute(sql`
      INSERT INTO player_aliases (playerId, playerName, alias)
      VALUES (${playerId}, ${playerName}, ${alias})
      ON DUPLICATE KEY UPDATE alias = alias
    `);
    console.log(`   ✓ Added alias "${alias}" → ${playerName} (${playerId})`);
  }

  console.log(`\n✅ Added ${aliases.length} new player aliases!`);
  console.log('\nRemaining ambiguous names that need manual resolution:');
  console.log('  - "Zach" (could be Zach Collins, Zach Edey, or Zach LaVine)');
  console.log('  - "Clark" (could be Jaylen Clark, Brandon Clarke, or Jordan Clarkson)');
  console.log('  - "Cooper" (could be Sharife Cooper or Cooper Flagg)');
  console.log('  - "Richard" (could be Will Richard, Nick Richards, Josh Richardson, or Jase Richardson)');
  console.log('  - "Berringer" (not found in database - may need to be added)');
  console.log('\nThese require checking the upgrade log context to determine the correct player.');

  process.exit(0);
}

main().catch(console.error);
