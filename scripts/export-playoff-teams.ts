import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log('Exporting playoff team rosters...\n');
  
  const playoffTeams = [
    'Raptors', 'Pacers', 'Spurs', 'Bucks', 'Rockets', 'Cavs', 'Wizards', 'Blazers',
    'Hawks', 'Hornets', 'Jazz', 'Nuggets', 'Pistons', 'Mavs', 'Kings', 'Bulls'
  ];
  
  const result = await db.execute(sql`
    SELECT name, overall, isRookie, team
    FROM players 
    WHERE team IN (${sql.join(playoffTeams.map(t => sql.raw(`'${t}'`)), sql`, `)})
    ORDER BY 
      team ASC,
      overall DESC,
      name ASC
  `);
  
  const players = result[0] as any[];
  
  console.log(`Found ${players.length} players across ${playoffTeams.length} playoff teams:\n`);
  
  // Count by team
  const teamCounts: Record<string, number> = {};
  playoffTeams.forEach(team => teamCounts[team] = 0);
  
  players.forEach(p => {
    if (p.team in teamCounts) {
      teamCounts[p.team]++;
    }
  });
  
  console.log('Team breakdown:');
  Object.entries(teamCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([team, count]) => {
      console.log(`  ${team}: ${count} players`);
    });
  
  // Create CSV
  const csvLines = ['Name,Overall,Rookie,Team'];
  
  players.forEach(player => {
    const name = player.name || '';
    const overall = player.overall || '';
    const rookie = player.isRookie === 1 ? 'Yes' : 'No';
    const team = player.team || '';
    
    // Escape commas in names
    const escapedName = name.includes(',') ? `"${name}"` : name;
    
    csvLines.push(`${escapedName},${overall},${rookie},${team}`);
  });
  
  const csvContent = csvLines.join('\n');
  const outputPath = '/home/ubuntu/playoff-teams-roster.csv';
  
  fs.writeFileSync(outputPath, csvContent);
  
  console.log(`\n✅ CSV exported to: ${outputPath}`);
  console.log(`Total players: ${players.length}`);
  
  process.exit(0);
}

main().catch(console.error);
