import { router, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { players, playerUpgrades, upgradeLog } from '../../drizzle/schema';
import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';

export const upgradeLimitsRouter = router({
  // Get all players with their comprehensive upgrade status
  getUpgradeLimitStatus: publicProcedure
    .input(z.object({
      filterTeam: z.string().optional(),
      filterStatus: z.enum(['all', 'at_cap', 'near_cap']).default('all'),
      filterType: z.enum(['all', 'overall', 'badge', 'welcome', 'fivegm', 'rookie', 'og']).default('all'),
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
      
      // For each player, calculate their comprehensive upgrade status
      const results = await Promise.all(allPlayers.map(async (player: any) => {
        // Get all upgrades for this player from playerUpgrades table
        const upgrades = await db
          .select()
          .from(playerUpgrades)
          .where(eq(playerUpgrades.playerId, player.id));
        
        // Get all upgrades from upgradeLog table for this player
        const logUpgrades = await db
          .select()
          .from(upgradeLog)
          .where(eq(upgradeLog.playerName, player.name));
        
        // Initialize counters for different upgrade types
        const sevenGameByAttribute: Record<string, number> = {}; // Track per-attribute 7GM usage
        let sevenGameCount = 0;
        let welcomeUpgrades = 0;
        let fiveGameBadges = 0;
        let rookieBadgesToSilver = 0;
        let ogUpgrades = 0;
        let superstarUpgrades = 0;
        let activityBonusUpgrades = 0;
        
        // Process playerUpgrades table
        upgrades.forEach((upgrade: any) => {
          try {
            const metadata = upgrade.metadata ? JSON.parse(upgrade.metadata) : {};
            
            // 7-Game attribute upgrades - track per attribute
            if (metadata.upgradeType === '7GM' && upgrade.upgradeType === 'attribute' && upgrade.statIncrease && upgrade.statName) {
              const attrName = upgrade.statName;
              sevenGameByAttribute[attrName] = (sevenGameByAttribute[attrName] || 0) + upgrade.statIncrease;
              sevenGameCount++;
            }
            
            // Welcome upgrades
            if (metadata.upgradeType === 'Welcome') {
              welcomeUpgrades++;
            }
            
            // 5-Game badge upgrades
            if (metadata.upgradeType === '5GM') {
              fiveGameBadges++;
            }
            
            // Rookie badge upgrades to silver
            if (player.isRookie && upgrade.upgradeType === 'new_badge' && upgrade.toLevel === 'silver') {
              rookieBadgesToSilver++;
            }
            
            // OG upgrades
            if (metadata.upgradeType === 'OG') {
              ogUpgrades++;
            }
            
            // Superstar Pack upgrades
            if (metadata.upgradeType === 'Superstar') {
              superstarUpgrades++;
            }
            
            // Activity Bonus upgrades
            if (metadata.upgradeType === 'Activity') {
              activityBonusUpgrades++;
            }
          } catch (e) {
            // Skip invalid metadata
          }
        });
        
        // Also process upgradeLog table for additional tracking
        logUpgrades.forEach((log: any) => {
          const sourceType = log.sourceType?.toLowerCase() || '';
          
          if (sourceType.includes('welcome')) {
            welcomeUpgrades++;
          } else if (sourceType.includes('5') || sourceType.includes('five')) {
            fiveGameBadges++;
          } else if (sourceType.includes('og')) {
            ogUpgrades++;
          } else if (sourceType.includes('superstar')) {
            superstarUpgrades++;
          } else if (sourceType.includes('activity')) {
            activityBonusUpgrades++;
          }
        });
        
        // Calculate overall 7GM status based on any attribute being at/near cap
        const attributeStatuses = Object.entries(sevenGameByAttribute).map(([attr, total]) => ({
          attribute: attr,
          used: total,
          remaining: Math.max(0, 6 - total),
          status: total >= 6 ? 'at_cap' : total >= 5 ? 'near_cap' : 'ok'
        }));
        
        // Overall status is worst status among all attributes
        const hasAnyCapped = attributeStatuses.some(a => a.status === 'at_cap');
        const hasAnyNearCap = attributeStatuses.some(a => a.status === 'near_cap');
        const sevenGameStatus = hasAnyCapped ? 'at_cap' : hasAnyNearCap ? 'near_cap' : 'ok';
        const badgeStatus = player.isRookie 
          ? (rookieBadgesToSilver >= 2 ? 'at_cap' : rookieBadgesToSilver >= 1 ? 'near_cap' : 'ok')
          : 'n/a';
        
        // Welcome upgrades: typically 2 max
        const welcomeStatus = welcomeUpgrades >= 2 ? 'at_cap' : welcomeUpgrades >= 1 ? 'near_cap' : 'ok';
        
        // 5GM badges: no strict limit but track usage
        const fiveGmStatus = fiveGameBadges >= 3 ? 'near_cap' : 'ok';
        
        return {
          id: player.id,
          fullName: player.name,
          team: player.team,
          overall: player.overall,
          isRookie: player.isRookie,
          
          // 7-Game Overall (per-attribute tracking)
          sevenGameByAttribute: attributeStatuses,
          sevenGameCount,
          sevenGameStatus,
          
          // Rookie Badges
          badgeUpgradesToSilver: rookieBadgesToSilver,
          badgeRemaining: player.isRookie ? Math.max(0, 2 - rookieBadgesToSilver) : null,
          badgeStatus,
          
          // Welcome Upgrades
          welcomeUpgrades,
          welcomeRemaining: Math.max(0, 2 - welcomeUpgrades),
          welcomeStatus,
          
          // 5-Game Badges
          fiveGameBadges,
          fiveGmStatus,
          
          // Other upgrade types
          ogUpgrades,
          superstarUpgrades,
          activityBonusUpgrades,
          
          // Total upgrades
          totalUpgrades: upgrades.length + logUpgrades.length,
        };
      }));
      
      // Apply filters
      let filtered = results;
      
      if (input.filterStatus !== 'all') {
        filtered = filtered.filter((p: any) => 
          p.sevenGameStatus === input.filterStatus || 
          p.badgeStatus === input.filterStatus ||
          p.welcomeStatus === input.filterStatus ||
          p.fiveGmStatus === input.filterStatus
        );
      }
      
      if (input.filterType === 'overall') {
        filtered = filtered.filter((p: any) => p.sevenGameStatus === 'at_cap' || p.sevenGameStatus === 'near_cap');
      } else if (input.filterType === 'badge') {
        filtered = filtered.filter((p: any) => p.badgeStatus === 'at_cap' || p.badgeStatus === 'near_cap');
      } else if (input.filterType === 'welcome') {
        filtered = filtered.filter((p: any) => p.welcomeStatus === 'at_cap' || p.welcomeStatus === 'near_cap');
      } else if (input.filterType === 'fivegm') {
        filtered = filtered.filter((p: any) => p.fiveGmStatus === 'near_cap');
      } else if (input.filterType === 'rookie') {
        filtered = filtered.filter((p: any) => p.isRookie);
      } else if (input.filterType === 'og') {
        filtered = filtered.filter((p: any) => p.ogUpgrades > 0);
      }
      
      // Calculate summary statistics
      const summary = {
        totalPlayers: filtered.length,
        atCapOverall: filtered.filter((p: any) => p.sevenGameStatus === 'at_cap').length,
        nearCapOverall: filtered.filter((p: any) => p.sevenGameStatus === 'near_cap').length,
        atCapBadge: filtered.filter((p: any) => p.badgeStatus === 'at_cap').length,
        nearCapBadge: filtered.filter((p: any) => p.badgeStatus === 'near_cap').length,
        atCapWelcome: filtered.filter((p: any) => p.welcomeStatus === 'at_cap').length,
        nearCapWelcome: filtered.filter((p: any) => p.welcomeStatus === 'near_cap').length,
        totalUpgrades: filtered.reduce((sum: number, p: any) => sum + p.totalUpgrades, 0),
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
