import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nba2k26',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

try {
  const conn = await pool.getConnection();
  const [rows] = await conn.query('SELECT id, instanceId, expiresAt, lockedAt FROM bot_instance_lock WHERE id = 1');
  console.log('Lock record:', JSON.stringify(rows, null, 2));
  
  // Check if expired
  if (rows.length > 0) {
    const now = new Date();
    const expiresAt = new Date(rows[0].expiresAt);
    console.log('Current time:', now.toISOString());
    console.log('Expires at:', expiresAt.toISOString());
    console.log('Is expired:', expiresAt < now);
  }
  
  conn.release();
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
