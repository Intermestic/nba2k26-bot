/**
 * Name normalization utilities for player name matching
 * Handles diacritics, punctuation, and special characters
 */

/**
 * Normalize a player name for matching by:
 * - Converting to lowercase
 * - Removing diacritics/accent marks (é → e, ñ → n, etc.)
 * - Removing apostrophes and hyphens
 * - Normalizing whitespace
 * - Normalizing Jr/Jr. variations
 * 
 * @param name - The player name to normalize
 * @returns Normalized name for matching
 * 
 * @example
 * normalizeName("Nikola Jokić") // "nikola jokic"
 * normalizeName("Luka Dončić") // "luka doncic"
 * normalizeName("D'Angelo Russell") // "dangelo russell"
 * normalizeName("Karl-Anthony Towns") // "karlanthony towns"
 * normalizeName("José Alvarado") // "jose alvarado"
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  return name
    // Convert to lowercase first
    .toLowerCase()
    // Remove diacritics using Unicode normalization (NFD = decompose, then remove combining marks)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove apostrophes and hyphens
    .replace(/['\-]/g, '')
    // Normalize Jr/Jr. variations
    .replace(/\bjr\.?$/i, 'jr')
    // Normalize whitespace (collapse multiple spaces, trim)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two player names match after normalization
 * 
 * @param name1 - First player name
 * @param name2 - Second player name
 * @returns True if names match after normalization
 * 
 * @example
 * namesMatch("Nikola Jokić", "Nikola Jokic") // true
 * namesMatch("D'Angelo Russell", "Dangelo Russell") // true
 * namesMatch("José Alvarado", "Jose Alvarado") // true
 */
export function namesMatch(name1: string, name2: string): boolean {
  return normalizeName(name1) === normalizeName(name2);
}

/**
 * Find a player in a list by normalized name matching
 * 
 * @param searchName - Name to search for
 * @param players - List of players with name property
 * @returns Matching player or null
 * 
 * @example
 * findByNormalizedName("Nikola Jokić", players) // finds "Nikola Jokic"
 */
export function findByNormalizedName<T extends { name: string }>(
  searchName: string,
  players: T[]
): T | null {
  const normalizedSearch = normalizeName(searchName);
  return players.find(p => normalizeName(p.name) === normalizedSearch) || null;
}
