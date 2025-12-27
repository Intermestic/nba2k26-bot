import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Starting upgrade history migration...\n');

// Get all upgrade log entries
const [logs] = await connection.query(`
  SELECT 
    ul.id,
    ul.playerName,
    ul.userName,
    ul.date,
    ul.sourceType,
    ul.sourceDetail,
    ul.upgradeType,
    ul.badgeOrAttribute,
    ul.fromValue,
    ul.toValue,
    ul.createdAt,
    p.id as playerId,
    p.team
  FROM upgrade_log ul
  LEFT JOIN players p ON p.name = ul.playerName
  ORDER BY ul.createdAt ASC
`);

console.log(`Found ${logs.length} upgrade log entries to migrate\n`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const log of logs) {
  try {
    // Skip if player not found
    if (!log.playerId) {
      console.log(`⚠️  Skipping ${log.playerName} - player not found in database`);
      skipCount++;
      continue;
    }

    // Extract user ID from userName (assuming Discord username format)
    // For now, use userName as userId since we don't have the actual Discord ID
    const userId = log.userName.replace(/[^a-zA-Z0-9]/g, '_');

    // Determine attribute name based on upgrade type
    let attributeName = log.badgeOrAttribute;
    if (log.upgradeType === 'Attribute') {
      // For attributes, use the attribute name directly
      attributeName = log.badgeOrAttribute;
    } else if (log.upgradeType === 'Badge') {
      // For badges, use badge name
      attributeName = log.badgeOrAttribute;
    }

    // Determine upgrade type based on source
    let upgradeType = log.sourceType || 'Unknown';
    if (log.sourceDetail) {
      // Use sourceDetail for more specific type
      upgradeType = log.sourceDetail;
    }

    // Insert into upgrade_history
    await connection.query(`
      INSERT INTO upgrade_history 
      (playerId, playerName, attributeName, upgradeType, userId, userName, team, previousValue, newValue, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      log.playerId,
      log.playerName,
      attributeName,
      upgradeType,
      userId,
      log.userName,
      log.team || 'Unknown',
      log.fromValue,
      log.toValue,
      log.createdAt
    ]);

    successCount++;
    if (successCount % 50 === 0) {
      console.log(`✅ Migrated ${successCount} entries...`);
    }
  } catch (error) {
    console.error(`❌ Error migrating log ${log.id}:`, error.message);
    errorCount++;
  }
}

console.log('\n=== Migration Complete ===');
console.log(`✅ Successfully migrated: ${successCount}`);
console.log(`⚠️  Skipped (player not found): ${skipCount}`);
console.log(`❌ Errors: ${errorCount}`);

// Show sample of migrated data
console.log('\n=== Sample Migrated Data (First 10) ===');
const [sample] = await connection.query(`
  SELECT 
    playerName,
    userName,
    attributeName,
    upgradeType,
    previousValue,
    newValue,
    DATE_FORMAT(createdAt, '%m/%d/%Y') as date
  FROM upgrade_history
  ORDER BY createdAt DESC
  LIMIT 10
`);

sample.forEach(row => {
  console.log(`${row.playerName} | ${row.userName} | ${row.attributeName} | ${row.upgradeType} | ${row.previousValue || 'N/A'} → ${row.newValue || 'N/A'} | ${row.date}`);
});

await connection.end();
