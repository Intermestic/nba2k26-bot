import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function analyzeCaps() {
  console.log("Analyzing team salary caps...\n");
  
  // Get all teams with their total overall ratings
  const teams = await db.execute(sql`
    SELECT 
      team,
      COUNT(*) as player_count,
      SUM(overall) as total_overall
    FROM players
    WHERE team NOT IN ('Free Agent', 'Free Agents')
    GROUP BY team
    ORDER BY total_overall DESC
  `);
  
  const teamData = teams[0] as any[];
  const CAP_LIMIT = 1098;
  
  console.log("=== TEAM CAP ANALYSIS ===\n");
  console.log("Cap Limit: 1098\n");
  
  let totalCap = 0;
  let teamsAtCap = 0;
  let teamsOverCap = 0;
  let teamsUnderCap = 0;
  
  for (const team of teamData) {
    const capUsed = team.total_overall;
    const capRemaining = CAP_LIMIT - capUsed;
    totalCap += capUsed;
    
    if (capUsed === CAP_LIMIT) teamsAtCap++;
    else if (capUsed > CAP_LIMIT) teamsOverCap++;
    else teamsUnderCap++;
    
    const status = capUsed > CAP_LIMIT ? "OVER" : capUsed === CAP_LIMIT ? "AT" : "UNDER";
    console.log(`${team.team.padEnd(20)} | Players: ${team.player_count} | Cap: ${capUsed} | Remaining: ${capRemaining >= 0 ? '+' : ''}${capRemaining} | ${status}`);
  }
  
  const avgCap = Math.round((totalCap / teamData.length) * 100) / 100;
  const avgCapRemaining = Math.round((CAP_LIMIT - avgCap) * 100) / 100;
  
  console.log("\n=== SUMMARY ===");
  console.log(`Total teams: ${teamData.length}`);
  console.log(`Average cap used: ${avgCap.toFixed(2)}`);
  console.log(`Average cap remaining: ${avgCapRemaining.toFixed(2)}`);
  console.log(`\nTeams at cap (${CAP_LIMIT}): ${teamsAtCap}`);
  console.log(`Teams over cap: ${teamsOverCap}`);
  console.log(`Teams under cap: ${teamsUnderCap}`);
  
  console.log("\n=== RECOMMENDATION ===");
  
  if (avgCapRemaining < 1) {
    console.log("⚠️  INCREASE CAP - Average team is using nearly all available cap space");
    console.log(`   Current avg remaining: ${avgCapRemaining.toFixed(2)}`);
    console.log(`   Suggested new cap: 1100 (+2 overall)`);
    console.log(`   This would give teams ~${(1100 - avgCap).toFixed(2)} average cap room`);
  } else if (avgCapRemaining > 5) {
    console.log("✓ KEEP CURRENT CAP - Teams have sufficient flexibility");
    console.log(`   Average cap room: ${avgCapRemaining.toFixed(2)}`);
  } else {
    console.log("~ CONSIDER INCREASE - Teams are getting tight on cap space");
    console.log(`   Current avg remaining: ${avgCapRemaining.toFixed(2)}`);
    console.log(`   A small increase to 1100 would provide more flexibility`);
  }
  
  process.exit(0);
}

analyzeCaps();
