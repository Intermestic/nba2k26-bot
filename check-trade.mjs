import { getDb } from './server/db.js';
import { tradeVotes } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
const vote = await db.select().from(tradeVotes).where(eq(tradeVotes.messageId, '1445268293186490548')).limit(1);
console.log('Trade vote data:', JSON.stringify(vote, null, 2));
process.exit(0);
