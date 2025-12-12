// Team assignments data to import
const teamAssignmentsData = [
  { discordUserId: '294659496247033857', team: 'Bucks' },
  { discordUserId: '265682789326782465', team: 'Bulls' },
  { discordUserId: '853835596123471883', team: 'Suns' },
  { discordUserId: '560133436501917726', team: 'Cavaliers' },
  { discordUserId: '1090784134416322663', team: 'Celtics' },
  { discordUserId: '651615180198903822', team: 'Hawks' },
  { discordUserId: '140276921685639168', team: 'Heat' },
  { discordUserId: '1188260635734196274', team: 'Hornets' },
  { discordUserId: '836929618404704316', team: 'Jazz' },
  { discordUserId: '609904178994872330', team: 'Pelicans' },
  { discordUserId: '675490663348961310', team: 'Kings' },
  { discordUserId: '1351006163780501676', team: 'Knicks' },
  { discordUserId: '764123341816201217', team: 'Lakers' },
  { discordUserId: '1061989363879264326', team: 'Magic' },
  { discordUserId: '716585837969801317', team: 'Mavs' },
  { discordUserId: '459172069641289739', team: 'Nuggets' },
  { discordUserId: '992170912554168440', team: 'Nets' },
  { discordUserId: '786412757028306954', team: 'Pacers' },
  { discordUserId: '683053192359182376', team: 'Raptors' },
  { discordUserId: '786625418396172289', team: 'Rockets' },
  { discordUserId: '1210078581892583445', team: 'Timberwolves' },
  { discordUserId: '668299741158834237', team: 'Trail Blazers' },
  { discordUserId: '327661967537864706', team: 'Spurs' },
  { discordUserId: '1032395638433919017', team: 'Warriors' },
  { discordUserId: '679275787664359435', team: 'Wizards' },
  { discordUserId: '1068828938765348904', team: 'Pistons' },
  { discordUserId: '1311886696907931728', team: 'Sixers' },
];

async function importTeamAssignments() {
  console.log('[Team Assignments] Starting import...');
  
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  const db = drizzle(connection);

  try {
    // Clear existing assignments
    await connection.execute('DELETE FROM team_assignments');
    console.log('[Team Assignments] Cleared existing assignments');

    // Insert new assignments
    for (const assignment of teamAssignmentsData) {
      await connection.execute(
        'INSERT INTO team_assignments (discordUserId, team) VALUES (?, ?)',
        [assignment.discordUserId, assignment.team]
      );
      console.log(`[Team Assignments] Imported: ${assignment.discordUserId} → ${assignment.team}`);
    }

    console.log(`[Team Assignments] Successfully imported ${teamAssignmentsData.length} team assignments`);
  } catch (error) {
    console.error('[Team Assignments] Import failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

importTeamAssignments().catch(console.error);
