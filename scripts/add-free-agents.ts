import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function addPlayers() {
  console.log("Adding missing free agency players...\n");
  
  const playersToAdd = [
    { name: "Cody Martin", overall: 74 },
    { name: "Mo Bamba", overall: 71 },
    { name: "Talen Horton-Tucker", overall: 71 },
    { name: "Drew Peterson", overall: 70 },
    { name: "Mason Jones", overall: 70 },
    { name: "Kendall Brown", overall: 70 },
    { name: "Kyle Mangas", overall: 70 },
    { name: "Gabe McGlothan", overall: 70 },
  ];
  
  let created = 0;
  let skipped = 0;
  
  for (const player of playersToAdd) {
    // Check if player already exists
    const check = await db.execute(sql`SELECT id, name FROM players WHERE name = ${player.name}`);
    
    if ((check[0] as any[]).length > 0) {
      console.log(`  ⊘ ${player.name} already exists`);
      skipped++;
    } else {
      const newId = `player-${Date.now() + created}`;
      await db.execute(sql`
        INSERT INTO players (id, name, overall, team)
        VALUES (${newId}, ${player.name}, ${player.overall}, 'Free Agent')
      `);
      console.log(`  ✓ Created ${player.name} (${player.overall} OVR, Free Agent)`);
      created++;
    }
  }
  
  // Verify all players
  console.log("\n========== VERIFICATION ==========");
  const verify = await db.execute(sql`
    SELECT name, overall, team FROM players 
    WHERE name IN ('Cody Martin', 'Mo Bamba', 'Talen Horton-Tucker', 'Drew Peterson', 
                   'Mason Jones', 'Kendall Brown', 'Kyle Mangas', 'Gabe McGlothan')
    ORDER BY overall DESC, name ASC
  `);
  
  for (const p of verify[0] as any[]) {
    console.log(`  ${p.name} (${p.team}): ${p.overall} OVR`);
  }
  
  console.log(`\n✓ Created ${created} new players, ${skipped} already existed`);
  
  process.exit(0);
}

addPlayers().catch(console.error);
