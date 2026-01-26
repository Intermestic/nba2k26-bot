import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log('Exporting players from Knicks, Mavs, Suns, Nets, and Free Agents...\n');
  
  const result = await db.execute(sql`
    SELECT name, overall, isRookie, team
    FROM players 
    WHERE team IN ('Knicks', 'Mavs', 'Suns', 'Nets', 'Free Agents')
    ORDER BY 
      CASE 
        WHEN team = 'Knicks' THEN 1
        WHEN team = 'Mavs' THEN 2
        WHEN team = 'Suns' THEN 3
        WHEN team = 'Nets' THEN 4
        WHEN team = 'Free Agents' THEN 5
      END,
      overall DESC,
      name ASC
  `);
  
  const players = result[0] as any[];
  
  console.log(`Found ${players.length} players:\n`);
  
  // Count by team
  const teamCounts = {
    'Knicks': 0,
    'Mavs': 0,
    'Suns': 0,
    'Nets': 0,
    'Free Agents': 0
  };
  
  players.forEach(p => {
    if (p.team in teamCounts) {
      teamCounts[p.team as keyof typeof teamCounts]++;
    }
  });
  
  console.log('Team breakdown:');
  Object.entries(teamCounts).forEach(([team, count]) => {
    console.log(`  ${team}: ${count} players`);
  });
  
  // Create CSV
  const csvLines = ['Name,Overall,Rookie'];
  
  players.forEach(player => {
    const name = player.name || '';
    const overall = player.overall || '';
    const rookie = player.isRookie === 1 ? 'Yes' : 'No';
    
    // Escape commas in names
    const escapedName = name.includes(',') ? `"${name}"` : name;
    
    csvLines.push(`${escapedName},${overall},${rookie}`);
  });
  
  const csvContent = csvLines.join('\n');
  const outputPath = '/home/ubuntu/teams-export.csv';
  
  fs.writeFileSync(outputPath, csvContent);
  
  console.log(`\n✅ CSV exported to: ${outputPath}`);
  console.log(`Total players: ${players.length}`);
  
  process.exit(0);
}

main().catch(console.error);
