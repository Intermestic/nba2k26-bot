import mysql from 'mysql2/promise';
import fs from 'fs';

// Load matches
const matches = JSON.parse(fs.readFileSync('/home/ubuntu/nba2k26-database/photo_matches.json', 'utf8'));

console.log(`Updating ${matches.length} players with photo URLs...`);

// Connect to database
const conn = await mysql.createConnection(process.env.DATABASE_URL);

let updated = 0;
let notFound = 0;

for (const match of matches) {
  try {
    const [result] = await conn.query(
      'UPDATE players SET photoUrl = ? WHERE name = ?',
      [match.photo_url, match.db_name]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✓ Updated: ${match.db_name} → ${match.photo_url}`);
      updated++;
    } else {
      console.log(`✗ Not found in DB: ${match.db_name}`);
      notFound++;
    }
  } catch (error) {
    console.error(`Error updating ${match.db_name}:`, error.message);
  }
}

await conn.end();

console.log(`\n=== Summary ===`);
console.log(`Updated: ${updated}`);
console.log(`Not found: ${notFound}`);
