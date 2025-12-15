import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get all attribute upgrades grouped by sourceType
const [rows] = await connection.query(`
  SELECT sourceType, sourceDetail, COUNT(*) as count
  FROM upgrade_log 
  WHERE upgradeType = 'Attribute'
  GROUP BY sourceType, sourceDetail
  ORDER BY count DESC
`);

console.log('\n=== Attribute Upgrade Source Types ===\n');
console.log('sourceType | sourceDetail | count');
console.log('-----------|--------------|------');

rows.forEach(row => {
  console.log(`${row.sourceType} | ${row.sourceDetail || 'NULL'} | ${row.count}`);
});

console.log(`\nTotal unique combinations: ${rows.length}`);

// Get sample records for each sourceType
console.log('\n\n=== Sample Records (First 30) ===\n');
const [samples] = await connection.query(`
  SELECT playerName, sourceType, sourceDetail, badgeOrAttribute, fromValue, toValue
  FROM upgrade_log 
  WHERE upgradeType = 'Attribute'
  ORDER BY id
  LIMIT 30
`);

samples.forEach(s => {
  console.log(`${s.playerName} | ${s.sourceType} | ${s.sourceDetail || 'NULL'} | ${s.badgeOrAttribute} | ${s.fromValue || 'NULL'}->${s.toValue}`);
});

await connection.end();
