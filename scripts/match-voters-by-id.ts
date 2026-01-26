import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// The 18 complete voters with their Discord IDs
const voters = [
  { username: '216goat', id: '1032395638433919017' },
  { username: '2kleague', id: '679275787664359435' },
  { username: 'alldayballin713', id: '786625418396172289' },
  { username: 'cam2345.', id: '1061989363879264326' },
  { username: 'frostychild', id: '560133436501917726' },
  { username: 'gsjayy3', id: '675490663348961310' },
  { username: 'jayguwop.', id: '764123341816201217' },
  { username: 'jota0620', id: '140276921685639168' },
  { username: 'kuroko4', id: '459172069641289739' },
  { username: 'lameloballcashed', id: '683053192359182376' },
  { username: 'leaddogak', id: '716585837969801317' },
  { username: 'puffpuff123', id: '609904178994872330' },
  { username: 'rickflair_', id: '265682789326782465' },
  { username: 'seabaschin', id: '327661967537864706' },
  { username: 'sirjordan10', id: '668299741158834237' },
  { username: 'xpoloxhawk', id: '651615180198903822' },
  { username: 'ykdagod', id: '643544792399085568' },
  { username: 'zqaze', id: '1351006163780501676' },
];

async function main() {
  console.log('Matching voters to teams...\n');
  
  // Get all team assignments
  const result = await db.execute(sql`SELECT discordUserId, team FROM team_assignments`);
  const assignments = result[0] as any[];
  
  const matched: Array<{ username: string; team: string }> = [];
  const unmatched: Array<{ username: string; id: string }> = [];
  
  for (const voter of voters) {
    const assignment = assignments.find((a: any) => a.discordUserId === voter.id);
    
    if (assignment) {
      matched.push({
        username: voter.username,
        team: assignment.team,
      });
    } else {
      unmatched.push(voter);
    }
  }
  
  console.log('========== VOTERS BY TEAM ==========\n');
  matched.sort((a, b) => a.team.localeCompare(b.team));
  matched.forEach(m => {
    console.log(`${m.team.padEnd(20)} - ${m.username}`);
  });
  
  if (unmatched.length > 0) {
    console.log('\n========== UNMATCHED VOTERS ==========');
    unmatched.forEach(v => console.log(`  ${v.username} (ID: ${v.id})`));
  }
  
  console.log(`\n✅ Matched: ${matched.length}/${voters.length}`);
  
  process.exit(0);
}

main().catch(console.error);
