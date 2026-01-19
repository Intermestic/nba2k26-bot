/**
 * Player Matcher
 * 
 * Fuzzy matching for player names with:
 * - Name normalization (diacritics, special chars)
 * - Nickname support
 * - Learned aliases from database
 * - Multi-strategy matching
 */

import { logger } from '../services/logger';
import { DatabaseService } from '../services/database';
import { eq } from 'drizzle-orm';
import { players, learnedAliases } from '../../drizzle/schema';

// Common nicknames
const NICKNAMES: Record<string, string> = {
  'cp3': 'Chris Paul',
  'lebron': 'LeBron James',
  'king james': 'LeBron James',
  'greek freak': 'Giannis Antetokounmpo',
  'giannis': 'Giannis Antetokounmpo',
  'ad': 'Anthony Davis',
  'kd': 'Kevin Durant',
  'steph': 'Stephen Curry',
  'chef curry': 'Stephen Curry',
  'dame': 'Damian Lillard',
  'pg13': 'Paul George',
  'pg': 'Paul George',
  'kawhi': 'Kawhi Leonard',
  'joker': 'Nikola Jokic',
  'embiid': 'Joel Embiid',
  'ja': 'Ja Morant',
  'luka': 'Luka Doncic',
  'sga': 'Shai Gilgeous-Alexander',
  'kat': 'Karl-Anthony Towns',
  'bam': 'Bam Adebayo',
  'kyrie': 'Kyrie Irving',
  'jimmy': 'Jimmy Butler',
  'zion': 'Zion Williamson',
  'ant': 'Anthony Edwards',
  'trae': 'Trae Young',
  'booker': 'Devin Booker',
  'book': 'Devin Booker',
};

// Name aliases for special characters and common misspellings
const NAME_ALIASES: Record<string, string[]> = {
  'Vit Krejci': ['vit krejci', 'vit kreji', 'krejci'],
  'Nikola Jokić': ['jokic', 'nikola jokic'],
  'Luka Dončić': ['luka doncic', 'doncic'],
  'Giannis Antetokounmpo': ['giannis', 'antetokounmpo'],
  'Alperen Şengün': ['sengun', 'alperen sengun'],
  'Kyle Filipowski': ['kyle flipowski', 'filipowski'],
  "D'Angelo Russell": ['dangelo russell', 'angelo russell'],
  'Shai Gilgeous-Alexander': ['sga', 'gilgeous alexander'],
  'Karl-Anthony Towns': ['kat', 'towns', 'karl anthony towns'],
};

// Name variations
const NAME_VARIATIONS: Record<string, string> = {
  'angelo russell': "d'angelo russell",
  'mohammed bamba': 'mohamed bamba',
  'mo bamba': 'mohamed bamba',
};

interface MatchedPlayer {
  id: number;
  name: string;
  team: string;
  overall: number;
}

class PlayerMatcherClass {
  /**
   * Normalize a name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/['']/g, '') // Remove apostrophes
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate similarity between two strings (0-100)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeName(str1);
    const s2 = this.normalizeName(str2);

    if (s1 === s2) return 100;

    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      return 85;
    }

    // Levenshtein distance based similarity
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 100;

    const distance = this.levenshteinDistance(s1, s2);
    return Math.round((1 - distance / maxLen) * 100);
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Find a player by name with fuzzy matching
   */
  async findPlayer(searchName: string, filterFreeAgents = false): Promise<MatchedPlayer | null> {
    const db = DatabaseService.getDb();
    if (!db) {
      logger.warn('Database not available for player matching');
      return null;
    }

    let normalizedSearch = this.normalizeName(searchName);

    // Check name variations
    if (NAME_VARIATIONS[normalizedSearch]) {
      normalizedSearch = this.normalizeName(NAME_VARIATIONS[normalizedSearch]);
      logger.debug(`Name variation: ${searchName} → ${normalizedSearch}`);
    }

    // Check nicknames
    if (NICKNAMES[normalizedSearch]) {
      normalizedSearch = this.normalizeName(NICKNAMES[normalizedSearch]);
      logger.debug(`Nickname: ${searchName} → ${normalizedSearch}`);
    }

    // Strategy 1: Check learned aliases first
    try {
      const aliasResults = await db
        .select()
        .from(learnedAliases)
        .where(eq(learnedAliases.alias, normalizedSearch))
        .limit(1);

      if (aliasResults.length > 0) {
        const canonicalName = aliasResults[0].canonicalName;
        logger.info(`Found learned alias: ${searchName} → ${canonicalName}`);

        // Find player by canonical name
        const playerResults = await db
          .select()
          .from(players)
          .limit(1000);

        const player = playerResults.find(p => 
          this.normalizeName(p.name) === this.normalizeName(canonicalName)
        );

        if (player) {
          // Check free agent filter
          if (filterFreeAgents && player.team && player.team !== 'Free Agent') {
            logger.debug(`Player ${player.name} is not a free agent`);
            return null;
          }

          return {
            id: player.id,
            name: player.name,
            team: player.team || 'Free Agent',
            overall: player.overall,
          };
        }
      }
    } catch (error) {
      logger.debug('Learned aliases check failed:', error);
    }

    // Strategy 2: Check name aliases
    for (const [canonicalName, aliases] of Object.entries(NAME_ALIASES)) {
      if (aliases.some(alias => this.normalizeName(alias) === normalizedSearch)) {
        logger.debug(`Name alias match: ${searchName} → ${canonicalName}`);
        normalizedSearch = this.normalizeName(canonicalName);
        break;
      }
    }

    // Strategy 3: Fuzzy match against all players
    try {
      const allPlayers = await db.select().from(players).limit(1000);

      // Filter free agents if requested
      const candidates = filterFreeAgents
        ? allPlayers.filter(p => !p.team || p.team === 'Free Agent' || p.team === 'Free Agents')
        : allPlayers;

      // Score all candidates
      const scored = candidates.map(player => ({
        player,
        score: this.calculateSimilarity(normalizedSearch, player.name),
      }));

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score);

      // Get best match
      const best = scored[0];

      if (best && best.score >= 70) {
        logger.info(`Fuzzy match: ${searchName} → ${best.player.name} (${best.score}%)`);

        // Learn this alias for future use
        if (best.score < 100) {
          await this.learnAlias(normalizedSearch, best.player.name);
        }

        return {
          id: best.player.id,
          name: best.player.name,
          team: best.player.team || 'Free Agent',
          overall: best.player.overall,
        };
      }

      logger.warn(`No match found for: ${searchName} (best: ${best?.player.name} at ${best?.score}%)`);
      return null;
    } catch (error) {
      logger.error('Player search failed:', error);
      return null;
    }
  }

  /**
   * Learn a new alias for future use
   */
  private async learnAlias(alias: string, canonicalName: string): Promise<void> {
    const db = DatabaseService.getDb();
    if (!db) return;

    try {
      // Check if alias already exists
      const existing = await db
        .select()
        .from(learnedAliases)
        .where(eq(learnedAliases.alias, alias))
        .limit(1);

      if (existing.length > 0) {
        // Increment use count
        await db
          .update(learnedAliases)
          .set({ 
            useCount: (existing[0].useCount || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(learnedAliases.alias, alias));
      } else {
        // Create new alias
        await db.insert(learnedAliases).values({
          alias,
          canonicalName,
          useCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        logger.info(`Learned new alias: ${alias} → ${canonicalName}`);
      }
    } catch (error) {
      logger.debug('Failed to learn alias:', error);
    }
  }

  /**
   * Find multiple players by name
   */
  async findPlayers(names: string[]): Promise<Map<string, MatchedPlayer | null>> {
    const results = new Map<string, MatchedPlayer | null>();

    for (const name of names) {
      const player = await this.findPlayer(name);
      results.set(name, player);
    }

    return results;
  }
}

// Export singleton
export const PlayerMatcher = new PlayerMatcherClass();
