import { drizzle } from 'drizzle-orm/mysql2';

const db = drizzle(process.env.DATABASE_URL!);

async function addColumn() {
  try {
    await db.execute('ALTER TABLE players ADD COLUMN IF NOT EXISTS bbrefUrl TEXT');
    console.log('✅ bbrefUrl column added successfully');
  } catch (error) {
    console.error('Error adding column:', error);
  }
  process.exit(0);
}

addColumn();
