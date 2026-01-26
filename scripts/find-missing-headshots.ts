import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log('Finding players without headshots...\n');
  
  const result = await db.execute(sql`
    SELECT id, name, team, photoUrl 
    FROM players 
    WHERE photoUrl IS NULL OR photoUrl = '' OR photoUrl NOT LIKE '%cdn.nba.com%'
    ORDER BY name
  `);
  
  const players = result[0] as any[];
  
  console.log(`Found ${players.length} players without NBA.com headshots:\n`);
  
  players.forEach((player: any, index: number) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${player.name.padEnd(30)} (${player.team || 'Free Agent'})`);
  });
  
  console.log(`\nTotal: ${players.length} players`);
  
  process.exit(0);
}

main().catch(console.error);
