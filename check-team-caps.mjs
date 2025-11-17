import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [players] = await connection.query('SELECT team, name, overall FROM players ORDER BY team, overall DESC');

// Group by team
const teams = {};
players.forEach(p => {
  if (!teams[p.team]) teams[p.team] = [];
  teams[p.team].push(p);
});

// Calculate totals
const teamTotals = Object.entries(teams).map(([team, roster]) => {
  const total = roster.reduce((sum, p) => sum + p.overall, 0);
  const count = roster.length;
  return { team, total, count, overCap: total > 1098 };
}).sort((a, b) => b.total - a.total);

console.log('Team Cap Status (sorted by total):');
console.log('=====================================');
teamTotals.forEach(t => {
  const status = t.overCap ? '🔴 OVER' : '🟢 UNDER';
  const diff = t.total - 1098;
  const diffStr = diff > 0 ? `+${diff}` : diff;
  console.log(`${status} ${t.team.padEnd(20)} ${t.total}/1098 (${diffStr}) - ${t.count} players`);
});

await connection.end();
