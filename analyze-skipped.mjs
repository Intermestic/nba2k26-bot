import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get all distinct player names from upgrade_log
const upgradeLogNames = await db.execute(sql`SELECT DISTINCT playerName FROM upgrade_log ORDER BY playerName`);

// Get all player names from players table (including aliases)
const players = await db.execute(sql`
  SELECT p.name, GROUP_CONCAT(pa.alias SEPARATOR ', ') as aliases
  FROM players p
  LEFT JOIN player_aliases pa ON p.id = pa.playerId
  GROUP BY p.id, p.name
  ORDER BY p.name
`);

console.log('\n=== UPGRADE LOG PLAYER NAMES ===');
console.log('Total distinct names in upgrade_log:', upgradeLogNames[0].length);
console.log('\nFirst 50 names:');
upgradeLogNames[0].slice(0, 50).forEach(row => {
  console.log(`  - ${row.playerName}`);
});

console.log('\n=== PLAYERS TABLE ===');
console.log('Total players:', players[0].length);

// Find names in upgrade_log that don't match any player or alias
const playerNamesSet = new Set();
players[0].forEach(row => {
  playerNamesSet.add(row.name);
  if (row.aliases) {
    row.aliases.split(', ').forEach(alias => playerNamesSet.add(alias));
  }
});

const unmatchedNames = [];
upgradeLogNames[0].forEach(row => {
  if (!playerNamesSet.has(row.playerName)) {
    unmatchedNames.push(row.playerName);
  }
});

console.log('\n=== UNMATCHED NAMES (199 skipped) ===');
console.log('Total unmatched:', unmatchedNames.length);
console.log('\nUnmatched names:');
unmatchedNames.forEach(name => {
  console.log(`  - ${name}`);
});

// Try to find close matches
console.log('\n=== SUGGESTED ALIASES ===');
for (const unmatchedName of unmatchedNames.slice(0, 30)) {
  const lowerUnmatched = unmatchedName.toLowerCase();
  const possibleMatches = players[0].filter(p => {
    const lowerPlayerName = p.name.toLowerCase();
    // Check for partial matches
    const words = lowerUnmatched.split(' ');
    const playerWords = lowerPlayerName.split(' ');
    
    // Check if last names match
    if (words.length > 0 && playerWords.length > 0) {
      const lastName = words[words.length - 1];
      const playerLastName = playerWords[playerWords.length - 1];
      if (lastName === playerLastName) return true;
    }
    
    return lowerPlayerName.includes(lowerUnmatched) || lowerUnmatched.includes(lowerPlayerName);
  });
  
  if (possibleMatches.length > 0) {
    console.log(`\n"${unmatchedName}" might match:`);
    possibleMatches.forEach(m => console.log(`  → ${m.name}`));
  }
}

await connection.end();
