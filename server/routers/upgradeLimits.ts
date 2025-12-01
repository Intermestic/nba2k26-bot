import { router, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { players, playerUpgrades } from '../../drizzle/schema';
import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';

export const upgradeLimitsRouter = router({
  // Get all players with their upgrade limit status
  getUpgradeLimitStatus: publicProcedure
    .input(z.object({
      filterTeam: z.string().optional(),
      filterStatus: z.enum(['all', 'at_cap', 'near_cap']).default('all'),
      filterType: z.enum(['all', 'overall', 'badge']).default('all'),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Get all players
      const allPlayers = input.filterTeam
        ? await db.select().from(players).where(eq(players.team, input.filterTeam))
        : await db.select().from(players);
      
      // For each player, calculate their upgrade limit status
      const results = await Promise.all(allPlayers.map(async (player: any) => {
        // Get all upgrades for this player
        const upgrades = await db
          .select()
          .from(playerUpgrades)
          .where(eq(playerUpgrades.playerId, player.id));
        
        // Calculate 7-game overall upgrades (attribute upgrades from 7GM)
        let sevenGameOverallIncrease = 0;
        let sevenGameCount = 0;
        
        upgrades.forEach((upgrade: any) => {
          try {
            const metadata = upgrade.metadata ? JSON.parse(upgrade.metadata) : {};
            
            // Check if this is a 7-game attribute upgrade
            if (metadata.upgradeType === '7GM' && upgrade.upgradeType === 'attribute' && upgrade.statIncrease) {
              sevenGameOverallIncrease += upgrade.statIncrease;
              sevenGameCount++;
            }
          } catch (e) {
            // Skip invalid metadata
          }
        });
        
        // Calculate rookie badge upgrades to silver
        let badgeUpgradesToSilver = 0;
        
        if (player.isRookie) {
          upgrades.forEach((upgrade: any) => {
            try {
              const metadata = upgrade.metadata ? JSON.parse(upgrade.metadata) : {};
              
              // Check if this is a new badge upgraded to silver
              if (
                upgrade.upgradeType === 'new_badge' &&
                upgrade.toLevel === 'silver'
              ) {
                badgeUpgradesToSilver++;
              }
            } catch (e) {
              // Skip invalid metadata
            }
          });
        }
        
        // Determine status
        const sevenGameStatus = sevenGameOverallIncrease >= 6 ? 'at_cap' : sevenGameOverallIncrease >= 5 ? 'near_cap' : 'ok';
        const badgeStatus = player.isRookie 
          ? (badgeUpgradesToSilver >= 2 ? 'at_cap' : badgeUpgradesToSilver >= 1 ? 'near_cap' : 'ok')
          : 'n/a';
        
        return {
          id: player.id,
          fullName: player.name,
          team: player.team,
          overall: player.overall,
          isRookie: player.isRookie,
          sevenGameIncrease: sevenGameOverallIncrease,
          sevenGameCount,
          sevenGameRemaining: Math.max(0, 6 - sevenGameOverallIncrease),
          sevenGameStatus,
          badgeUpgradesToSilver,
          badgeRemaining: player.isRookie ? Math.max(0, 2 - badgeUpgradesToSilver) : null,
          badgeStatus,
        };
      }));
      
      // Apply filters
      let filtered = results;
      
      if (input.filterStatus !== 'all') {
        filtered = filtered.filter((p: any) => 
          p.sevenGameStatus === input.filterStatus || p.badgeStatus === input.filterStatus
        );
      }
      
      if (input.filterType === 'overall') {
        filtered = filtered.filter((p: any) => p.sevenGameStatus === 'at_cap' || p.sevenGameStatus === 'near_cap');
      } else if (input.filterType === 'badge') {
        filtered = filtered.filter((p: any) => p.badgeStatus === 'at_cap' || p.badgeStatus === 'near_cap');
      }
      
      // Calculate summary statistics
      const summary = {
        totalPlayers: filtered.length,
        atCapOverall: filtered.filter((p: any) => p.sevenGameStatus === 'at_cap').length,
        nearCapOverall: filtered.filter((p: any) => p.sevenGameStatus === 'near_cap').length,
        atCapBadge: filtered.filter((p: any) => p.badgeStatus === 'at_cap').length,
        nearCapBadge: filtered.filter((p: any) => p.badgeStatus === 'near_cap').length,
      };
      
      return {
        players: filtered,
        summary,
      };
    }),
  
  // Get list of all teams for filter dropdown
  getTeams: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const teams = await db
      .selectDistinct({ team: players.team })
      .from(players)
      .orderBy(players.team);
    
    return teams.map((t: any) => t.team);
  }),
});
