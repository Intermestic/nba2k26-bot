import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

const db = await getDb();
try {
  // Try a simple update
  const result = await db.execute(sql`UPDATE bot_instance_lock SET lockedAt = NOW() WHERE id = 1 AND instanceId = 'test'`);
  console.log('Result type:', typeof result);
  console.log('Result keys:', Object.keys(result || {}));
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('Result[0]:', result?.[0]);
  console.log('Result[1]:', result?.[1]);
  
  // Check if it's an array
  if (Array.isArray(result)) {
    console.log('Result is an array with length:', result.length);
    result.forEach((item, idx) => {
      console.log(`Item ${idx}:`, typeof item, Object.keys(item || {}));
    });
  }
} catch (err: any) {
  console.error('Error:', err.message);
}
process.exit(0);
