import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Team name aliases mapping to canonical names
const TEAM_ALIASES = {
  // 76ers / Sixers
  '76ers': 'Sixers',
  'seventy sixers': 'Sixers',
  
  // Cavaliers
  'cavs': 'Cavaliers',
  
  // Mavericks
  'mavericks': 'Mavs',
  'dallas': 'Mavs',
  
  // Trail Blazers
  'trailblazers': 'Trail Blazers',
  'blazers': 'Trail Blazers',
  'portland': 'Trail Blazers',
  
  // Timberwolves
  'wolves': 'Timberwolves',
  'twolves': 'Timberwolves',
  't-wolves': 'Timberwolves',
  
  // Other common aliases
  'gsw': 'Warriors',
  'golden state': 'Warriors',
  'la lakers': 'Lakers',
  'philly': 'Sixers',
  'philadelphia': 'Sixers',
  'san antonio': 'Spurs',
  'new york': 'Knicks',
  'brooklyn': 'Nets',
  'milwaukee': 'Bucks',
  'miami': 'Heat',
  'boston': 'Celtics',
  'chicago': 'Bulls',
  'cleveland': 'Cavaliers',
  'detroit': 'Pistons',
  'indiana': 'Pacers',
  'charlotte': 'Hornets',
  'atlanta': 'Hawks',
  'orlando': 'Magic',
  'washington': 'Wizards',
  'toronto': 'Raptors',
  'memphis': 'Grizzlies',
  'houston': 'Rockets',
  'new orleans': 'Pelicans',
  'sacramento': 'Kings',
  'phoenix': 'Suns',
  'utah': 'Jazz',
  'denver': 'Nuggets',
  'minnesota': 'Timberwolves',
  
  // Free Agents aliases
  'fa': 'Free Agents',
  'free agent': 'Free Agents',
  'freeagents': 'Free Agents',
};

const VALID_TEAMS = [
  'Free Agents',
  'Bucks',
  'Bulls',
  'Cavaliers',
  'Celtics',
  'Grizzlies',
  'Hawks',
  'Heat',
  'Hornets',
  'Jazz',
  'Kings',
  'Knicks',
  'Lakers',
  'Magic',
  'Mavs',
  'Nets',
  'Nuggets',
  'Pacers',
  'Pelicans',
  'Pistons',
  'Raptors',
  'Rockets',
  'Sixers',
  'Spurs',
  'Suns',
  'Timberwolves',
  'Trail Blazers',
  'Warriors',
  'Wizards',
];

function validateTeamName(team) {
  if (!team) return null;
  
  const normalized = team.trim().toLowerCase();
  
  // Check canonical names first
  const canonical = VALID_TEAMS.find(
    validTeam => validTeam.toLowerCase() === normalized
  );
  if (canonical) return canonical;
  
  // Check aliases
  const aliasMatch = TEAM_ALIASES[normalized];
  if (aliasMatch) return aliasMatch;
  
  return null;
}

// Database connection
const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: {
    rejectUnauthorized: true
  }
});

console.log('Starting team name normalization...\n');

// Get all trades
const [allTrades] = await connection.execute('SELECT * FROM trades');

console.log(`Found ${allTrades.length} trades to check\n`);

let updatedCount = 0;

for (const trade of allTrades) {
  const normalizedTeam1 = validateTeamName(trade.team1);
  const normalizedTeam2 = validateTeamName(trade.team2);
  
  if (!normalizedTeam1 || !normalizedTeam2) {
    console.log(`❌ Trade ${trade.id} (${trade.messageId}): Invalid team names`);
    console.log(`   team1: "${trade.team1}" → ${normalizedTeam1 || 'INVALID'}`);
    console.log(`   team2: "${trade.team2}" → ${normalizedTeam2 || 'INVALID'}`);
    continue;
  }
  
  // Check if normalization is needed
  if (trade.team1 !== normalizedTeam1 || trade.team2 !== normalizedTeam2) {
    console.log(`🔄 Updating trade ${trade.id} (${trade.messageId}):`);
    console.log(`   team1: "${trade.team1}" → "${normalizedTeam1}"`);
    console.log(`   team2: "${trade.team2}" → "${normalizedTeam2}"`);
    
    await connection.execute(
      'UPDATE trades SET team1 = ?, team2 = ? WHERE id = ?',
      [normalizedTeam1, normalizedTeam2, trade.id]
    );
    
    updatedCount++;
  }
}

console.log(`\n✅ Normalization complete! Updated ${updatedCount} trades.`);

await connection.end();
