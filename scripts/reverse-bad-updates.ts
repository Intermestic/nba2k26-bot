import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// Reverse all the bad updates - restore original ratings
const reversals = [
  { name: "Stephon Castle", correct: 85 },
  { name: "Jamison Battle", correct: 86 },
  { name: "Deandre Ayton", correct: 81 },
  { name: "Josh Green", correct: 74 },
  { name: "Patrick Williams", correct: 74 },
  { name: "Malik Monk", correct: 77 },
  { name: "Moussa Diabate", correct: 78 },
  { name: "Spencer Jones", correct: 84 },
  { name: "Jalen Pickett", correct: 81 },
  { name: "Kon Knueppel", correct: 85 },
  { name: "Coby White", correct: 82 },
  { name: "Dalton Knecht", correct: 75 },
  { name: "Collin Murray-Boyles", correct: 84 },
  { name: "Svi Mykhailiuk", correct: 76 },
  { name: "Ayo Dosunmu", correct: 79 },
  { name: "DeMar DeRozan", correct: 84 },
  { name: "Keldon Johnson", correct: 80 },
  { name: "Ja'Kobe Walter", correct: 81 },
  { name: "Tim Hardaway Jr.", correct: 86 },
  { name: "Austin Reaves", correct: 88 },
  { name: "Marcus Smart", correct: 77 },
  { name: "Julian Champagnie", correct: 78 },
  { name: "Ochai Agbaji", correct: 70 },
  { name: "Brandon Miller", correct: 84 },
  { name: "Matas Buzelis", correct: 81 },
  { name: "Precious Achiuwa", correct: 76 },
  { name: "Harrison Barnes", correct: 78 },
  { name: "Sandro Mamukelashvili", correct: 82 },
  { name: "Keyonte George", correct: 86 },
  { name: "Kevin Love", correct: 76 },
  { name: "Josh Giddey", correct: 85 },
  { name: "Zach Collins", correct: 77 },
  { name: "Zeke Nnaji", correct: 70 },
  { name: "Nick Richards", correct: 76 },
  { name: "Maxime Raynaud", correct: 79 },
  { name: "Keegan Murray", correct: 79 },
  { name: "Keon Ellis", correct: 76 },
  { name: "Jusuf Nurkic", correct: 79 },
  { name: "PJ Hall", correct: 72 },
  { name: "Bruce Brown", correct: 74 },
  { name: "DaRon Holmes II", correct: 75 },
  { name: "Jake LaRavia", correct: 77 },
  { name: "Anthony Black", correct: 78 },
  { name: "Cory Joseph", correct: 72 },
  { name: "Ryan Dunn", correct: 77 },
  { name: "Nique Clifford", correct: 75 },
  { name: "Kyle Filipowski", correct: 76 },
  { name: "Nikola Vucevic", correct: 83 },
  { name: "Isaac Okoro", correct: 77 },
  { name: "Caleb Houstan", correct: 73 },
  { name: "Jamaree Bouyea", correct: 73 },
  { name: "Rasheer Fleming", correct: 70 },
  { name: "Dennis Schroder", correct: 78 },
  { name: "Dylan Cardwell", correct: 71 },
  { name: "Immanuel Quickley", correct: 80 },
  { name: "Ace Bailey", correct: 78 },
];

async function reverse() {
  console.log("Reversing bad rating updates...\n");
  
  let fixed = 0;
  
  for (const player of reversals) {
    const result = await db.execute(sql`
      UPDATE players 
      SET overall = ${player.correct}
      WHERE name = ${player.name}
    `);
    
    if ((result[0] as any).affectedRows > 0) {
      console.log(`  ✓ ${player.name} → ${player.correct}`);
      fixed++;
    } else {
      console.log(`  ⚠ ${player.name} not found`);
    }
  }
  
  console.log(`\n✓ Fixed ${fixed} players`);
  
  // Verify a few key players
  console.log("\n========== VERIFICATION ==========");
  const verify = await db.execute(sql`
    SELECT name, overall, team 
    FROM players 
    WHERE name IN ('Stephon Castle', 'Deandre Ayton', 'Malik Monk', 'Josh Green')
    ORDER BY name
  `);
  
  for (const p of verify[0] as any[]) {
    console.log(`  ${p.name} (${p.team}): ${p.overall} OVR`);
  }
  
  process.exit(0);
}

reverse();
