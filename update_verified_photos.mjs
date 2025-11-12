import mysql from 'mysql2/promise';
import fs from 'fs';

// Load fuzzy matches
const allMatches = JSON.parse(fs.readFileSync('/home/ubuntu/nba2k26-database/fuzzy_photo_matches.json', 'utf8'));

// Only use high-confidence matches (>90% similarity) or manually verified
const verifiedMatches = allMatches.filter(m => {
  // High confidence automatic matches
  if (m.similarity >= 0.90) return true;
  
  // Manually verified correct matches
  const verified = [
    'EJ Harkless',
    'Eli Ndiaye',
    'Ron Holland',
    'Liam McNeely',
    'Steph Curry'
  ];
  
  return verified.includes(m.db_name);
});

console.log(`Updating ${verifiedMatches.length} verified players with photo URLs...`);

// Connect to database
const conn = await mysql.createConnection(process.env.DATABASE_URL);

let updated = 0;
let notFound = 0;

for (const match of verifiedMatches) {
  try {
    const [result] = await conn.query(
      'UPDATE players SET photoUrl = ? WHERE name = ?',
      [match.photo_url, match.db_name]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✓ Updated (${(match.similarity * 100).toFixed(1)}%): ${match.db_name} → ${match.nba_name}`);
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
console.log(`\nTotal photos added so far: ${20 + updated} out of 140 missing`);
