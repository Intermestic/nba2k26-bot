import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=== Importing 7GM Attribute Upgrades from upgrade_log ===\n');

// Step 1: Get all players to map names to IDs
const [players] = await connection.query('SELECT id, name FROM players');
const playerNameToId = {};
players.forEach(p => {
  playerNameToId[p.name] = p.id;
});

console.log(`Found ${players.length} players in database\n`);

// Step 2: Get all 7GM attribute upgrades from upgrade_log
// 7GM upgrades are: sourceType IN ('Game', 'Award')
// Exclude: Welcome, Rookie, OG
const [logUpgrades] = await connection.query(`
  SELECT id, playerName, date, sourceType, sourceDetail, badgeOrAttribute, fromValue, toValue
  FROM upgrade_log 
  WHERE upgradeType = 'Attribute'
  AND sourceType IN ('Game', 'Award')
  ORDER BY id
`);

console.log(`Found ${logUpgrades.length} 7GM attribute upgrades in upgrade_log\n`);

// Step 3: Insert into player_upgrades table
let imported = 0;
let skipped = 0;
let errors = [];

for (const log of logUpgrades) {
  const playerId = playerNameToId[log.playerName];
  
  if (!playerId) {
    skipped++;
    errors.push(`Player not found: ${log.playerName}`);
    continue;
  }
  
  // Calculate stat increase
  const fromVal = parseInt(log.fromValue) || 0;
  const toVal = parseInt(log.toValue) || 0;
  const statIncrease = toVal - fromVal;
  
  if (statIncrease <= 0) {
    skipped++;
    errors.push(`Invalid stat increase for ${log.playerName}: ${log.fromValue}->${log.toValue}`);
    continue;
  }
  
  // Create metadata JSON
  const metadata = JSON.stringify({
    upgradeType: '7GM',
    source: log.sourceType,
    sourceDetail: log.sourceDetail,
    date: log.date,
    importedFrom: 'upgrade_log',
    upgradeLogId: log.id
  });
  
  try {
    // Insert into player_upgrades (note: no updatedAt column)
    await connection.query(`
      INSERT INTO player_upgrades (playerId, playerName, upgradeType, statName, statIncrease, newStatValue, metadata, createdAt, completedAt)
      VALUES (?, ?, 'attribute', ?, ?, ?, ?, NOW(), NOW())
    `, [playerId, log.playerName, log.badgeOrAttribute, statIncrease, toVal, metadata]);
    
    imported++;
    
    if (imported % 10 === 0) {
      console.log(`Imported ${imported}/${logUpgrades.length}...`);
    }
  } catch (err) {
    skipped++;
    errors.push(`Error importing ${log.playerName} ${log.badgeOrAttribute}: ${err.message}`);
  }
}

console.log(`\n=== Import Complete ===`);
console.log(`Successfully imported: ${imported}`);
console.log(`Skipped: ${skipped}`);

if (errors.length > 0) {
  console.log(`\nErrors (first 10):`);
  errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
}

await connection.end();
