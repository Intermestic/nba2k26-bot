import { getDb } from './server/db.js';
import { scheduledMessages } from './drizzle/schema.js';

const db = await getDb();
const messages = await db.select().from(scheduledMessages);
console.log(JSON.stringify(messages, null, 2));
