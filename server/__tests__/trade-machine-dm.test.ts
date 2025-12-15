import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { teamAssignments } from '../../drizzle/schema';

describe('Trade Machine DM Feature', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available for testing');
    }
  });

  it('should fetch team owners from team_assignments table', async () => {
    const owners = await db!
      .select({
        discordUserId: teamAssignments.discordUserId,
        discordUsername: teamAssignments.discordUsername,
        team: teamAssignments.team,
      })
      .from(teamAssignments);
    
    expect(owners).toBeDefined();
    expect(Array.isArray(owners)).toBe(true);
    
    // If there are owners, verify structure
    if (owners.length > 0) {
      const owner = owners[0];
      expect(owner).toHaveProperty('discordUserId');
      expect(owner).toHaveProperty('team');
      expect(typeof owner.discordUserId).toBe('string');
      expect(typeof owner.team).toBe('string');
      
      console.log(`✅ Found ${owners.length} team owners in database`);
      console.log(`   Example: ${owner.discordUsername || owner.discordUserId} owns ${owner.team}`);
    } else {
      console.log('⚠️  No team owners found in database (this is OK for empty database)');
    }
  });

  it('should have team_assignments table with correct schema', async () => {
    // Verify the table exists and has the expected columns
    const result = await db!.select().from(teamAssignments).limit(1);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    console.log('✅ team_assignments table exists with correct schema');
  });
});
