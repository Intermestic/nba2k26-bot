import { getDb } from './server/db.js';
import { botSingletonLock } from './drizzle/schema.js';

const db = await getDb();
const lock = await db.select().from(botSingletonLock);
console.log('Lock status:', JSON.stringify(lock, null, 2));
