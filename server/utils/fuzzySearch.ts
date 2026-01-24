import Fuse from 'fuse.js';

export interface PlayerSearchResult {
  id: number;
  name: string;
  overall: number;
  team: string | null;
  photo_url: string | null | undefined;
  player_page_url: string | null | undefined;
  score?: number;
}

/**
 * Create a fuzzy search index for players
 * Handles case-insensitivity and special character matching
 */
export function createPlayerSearchIndex(players: PlayerSearchResult[]) {
  return new Fuse(players, {
    keys: ['name', 'team'],
    threshold: 0.4, // 0.4 = 60% match required (allows typos)
    ignoreLocation: true,
    minMatchCharLength: 2,
    useExtendedSearch: true,
    includeScore: true,
  });
}

/**
 * Search players with fuzzy matching
 * Handles typos, abbreviations, and partial names
 * 
 * Examples:
 * - "nikola jokic" matches "Nikola Jokic"
 * - "jokic" matches "Nikola Jokic"
 * - "nikola jokik" matches "Nikola Jokic" (typo tolerance)
 * - "luka" matches "Luka Doncic"
 * - "luka d" matches "Luka Doncic"
 */
export function fuzzySearchPlayers(
  query: string,
  players: PlayerSearchResult[],
  limit: number = 10
): PlayerSearchResult[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const fuse = createPlayerSearchIndex(players);
  const results = fuse.search(query);

  // Return top results with scores
  return results
    .slice(0, limit)
    .map(result => ({
      ...result.item,
      score: result.score,
    }));
}

/**
 * Exact match with fallback to fuzzy search
 * First tries exact match, then fuzzy if no exact match found
 */
export function searchPlayersWithFallback(
  query: string,
  players: PlayerSearchResult[],
  limit: number = 10
): PlayerSearchResult[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();

  // Try exact match first
  const exactMatches = players.filter(p =>
    p.name.toLowerCase() === queryLower
  );

  if (exactMatches.length > 0) {
    return exactMatches.slice(0, limit);
  }

  // Try prefix match (e.g., "Nikola" matches "Nikola Jokic")
  const prefixMatches = players.filter(p =>
    p.name.toLowerCase().startsWith(queryLower)
  );

  if (prefixMatches.length > 0) {
    return prefixMatches.slice(0, limit);
  }

  // Fall back to fuzzy search
  return fuzzySearchPlayers(query, players, limit);
}

/**
 * Search players by team
 */
export function searchPlayersByTeam(
  team: string,
  players: PlayerSearchResult[]
): PlayerSearchResult[] {
  return players.filter(p =>
    p.team?.toLowerCase() === team.toLowerCase()
  );
}

/**
 * Search players by overall rating range
 */
export function searchPlayersByRating(
  minRating: number,
  maxRating: number,
  players: PlayerSearchResult[]
): PlayerSearchResult[] {
  return players.filter(p =>
    p.overall >= minRating && p.overall <= maxRating
  );
}

/**
 * Combined search: name + team + rating
 */
export function searchPlayersCombined(
  query: string,
  team?: string,
  minRating?: number,
  maxRating?: number,
  players?: PlayerSearchResult[]
): PlayerSearchResult[] {
  if (!players) return [];

  let results = players;

  // Filter by team if provided
  if (team) {
    results = results.filter(p =>
      p.team?.toLowerCase() === team.toLowerCase()
    );
  }

  // Filter by rating if provided
  if (minRating !== undefined || maxRating !== undefined) {
    results = results.filter(p => {
      if (minRating !== undefined && p.overall < minRating) return false;
      if (maxRating !== undefined && p.overall > maxRating) return false;
      return true;
    });
  }

  // Search by name if query provided
  if (query && query.trim().length > 0) {
    results = searchPlayersWithFallback(query, results);
  }

  return results;
}
