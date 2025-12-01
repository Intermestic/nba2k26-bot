import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_URL.replace('file:', ''));

// Get teams with more than 14 players
const teamsWithExtra = db.prepare(`
  SELECT team, COUNT(*) as player_count 
  FROM players 
  GROUP BY team 
  HAVING COUNT(*) > 14 
  ORDER BY player_count DESC
`).all();

console.log('Teams with more than 14 players:');
console.log(teamsWithExtra);
console.log('\n');

// For each team, find duplicate players
for (const teamData of teamsWithExtra) {
  console.log(`\n=== ${teamData.team} (${teamData.player_count} players) ===`);
  
  // Get all players for this team
  const players = db.prepare(`
    SELECT id, name, overall, position 
    FROM players 
    WHERE team = ? 
    ORDER BY name
  `).all(teamData.team);
  
  // Find duplicates by name
  const nameCount = {};
  players.forEach(p => {
    if (!nameCount[p.name]) {
      nameCount[p.name] = [];
    }
    nameCount[p.name].push(p);
  });
  
  // Show duplicates
  Object.entries(nameCount).forEach(([name, instances]) => {
    if (instances.length > 1) {
      console.log(`\nDUPLICATE: ${name}`);
      instances.forEach(p => {
        console.log(`  ID: ${p.id}, Overall: ${p.overall}, Position: ${p.position}`);
      });
    }
  });
}

db.close();
