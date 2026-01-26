import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// The 18 complete voters
const voters = [
  '216goat',
  '2kleague',
  'alldayballin713',
  'cam2345.',
  'frostychild',
  'gsjayy3',
  'jayguwop.',
  'jota0620',
  'kuroko4',
  'lameloballcashed',
  'leaddogak',
  'puffpuff123',
  'rickflair_',
  'seabaschin',
  'sirjordan10',
  'xpoloxhawk',
  'ykdagod',
  'zqaze',
];

async function main() {
  console.log('Matching voters to teams...\n');
  
  // Check if there's a users or owners table
  const tables = await db.execute(sql`SHOW TABLES`);
  console.log('Available tables:', (tables[0] as any[]).map((t: any) => Object.values(t)[0]).join(', '));
  console.log();
  
  // Try to find a table that maps Discord users to teams
  const teamOwners = await db.execute(sql`
    SELECT * 
    FROM team_assignments 
    ORDER BY team_name
  `).catch(() => null);
  
  if (teamOwners && teamOwners[0]) {
    console.log('Found team_owners table:\n');
    const owners = teamOwners[0] as any[];
    
    const matched: Array<{ voter: string; team: string; ownerName?: string }> = [];
    const unmatched: string[] = [];
    
    for (const voter of voters) {
      const owner = owners.find((o: any) => 
        o.discord_username?.toLowerCase() === voter.toLowerCase()
      );
      
      if (owner) {
        matched.push({
          voter,
          team: owner.team,
          ownerName: owner.owner_name,
        });
      } else {
        unmatched.push(voter);
      }
    }
    
    console.log('========== MATCHED VOTERS ==========');
    matched.sort((a, b) => a.team.localeCompare(b.team));
    matched.forEach(m => {
      console.log(`${m.team.padEnd(20)} - ${m.voter}${m.ownerName ? ` (${m.ownerName})` : ''}`);
    });
    
    if (unmatched.length > 0) {
      console.log('\n========== UNMATCHED VOTERS ==========');
      unmatched.forEach(v => console.log(`  ${v}`));
    }
    
    console.log(`\nMatched: ${matched.length}/${voters.length}`);
    
  } else {
    console.log('No team_owners table found. Checking for other user tables...');
    
    // List all tables to help debug
    const allTables = (tables[0] as any[]).map((t: any) => Object.values(t)[0]);
    console.log('\nAvailable tables:', allTables.join(', '));
  }
  
  process.exit(0);
}

main().catch(console.error);
