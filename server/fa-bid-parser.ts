import { getDb } from './db';
import { players, faBids, bidWindows } from '../drizzle/schema';
import { eq, and, sql, gt } from 'drizzle-orm';
import { extract } from 'fuzzball';

// Only process messages AFTER this status update message
export const MIN_BID_MESSAGE_ID = '1438945025479282822';

interface ParsedBid {
  playerName: string;
  bidAmount: number;
  dropPlayer?: string; // Optional for cut transactions
}

/**
 * Parse FA bid message using detection keywords
 * Returns parsed bid or null if not a valid bid
 */
export function parseBidMessage(message: string): ParsedBid | null {
  const text = message.trim().toLowerCase();
  
  // Check for acquisition keywords
  const hasAcquisition = /\b(sign|add|pickup)\b/i.test(text);
  
  // Check for value keywords  
  const hasValue = /\b(bid|coins?|\$)\b/i.test(text);
  
  // Must have at least one acquisition OR value keyword
  if (!hasAcquisition && !hasValue) {
    return null;
  }
  
  // Step A: Identify cut player (optional)
  let dropPlayer: string | undefined;
  const cutPattern = /\b(cut|drop|waive)\s+([^.\n,]+?)(?=\s*(?:sign|add|pickup|bid|\d|$))/i;
  const cutMatch = message.match(cutPattern);
  if (cutMatch) {
    dropPlayer = cutMatch[2].trim();
  }
  
  // Step B: Identify signed player (required)
  const signPattern = /\b(sign|add|pickup)\s+([^.\n,]+?)(?=\s*(?:bid|\d|$))/i;
  const signMatch = message.match(signPattern);
  
  if (!signMatch) {
    return null; // No player to sign found
  }
  
  let playerName = signMatch[2].trim();
  
  // Step C: Identify bid amount
  let bidAmount = 1; // Default
  
  // Look for explicit "Bid X" pattern
  const bidKeywordPattern = /\bbid\s*[:\s]*(\d+)/i;
  const bidKeywordMatch = message.match(bidKeywordPattern);
  
  if (bidKeywordMatch) {
    bidAmount = parseInt(bidKeywordMatch[1]);
  } else {
    // Look for standalone number at end of line
    const standaloneNumberPattern = /(\d+)\s*$/;
    const standaloneMatch = message.match(standaloneNumberPattern);
    
    if (standaloneMatch) {
      bidAmount = parseInt(standaloneMatch[1]);
    }
  }
  
  return {
    playerName: playerName.trim(),
    bidAmount,
    dropPlayer
  };
}

/**
 * Find player by fuzzy name matching with nickname support
 */
export async function findPlayerByFuzzyName(name: string): Promise<{ id: string; name: string; team: string; overall: number } | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Nickname mappings
  const nicknames: Record<string, string> = {
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
    'dame time': 'Damian Lillard',
    'pg13': 'Paul George',
    'pg': 'Paul George',
    'kawhi': 'Kawhi Leonard',
    'the claw': 'Kawhi Leonard',
    'joker': 'Nikola Jokic',
    'the process': 'Joel Embiid',
    'embiid': 'Joel Embiid',
    'ja': 'Ja Morant',
    'luka': 'Luka Doncic',
    'don': 'Donovan Mitchell',
    'spida': 'Donovan Mitchell',
    'booker': 'Devin Booker',
    'book': 'Devin Booker',
    'trae': 'Trae Young',
    'ice trae': 'Trae Young',
    'ant': 'Anthony Edwards',
    'ant-man': 'Anthony Edwards',
    'sga': 'Shai Gilgeous-Alexander',
    'jt': 'Jayson Tatum',
    'jb': 'Jaylen Brown',
    'jimmy': 'Jimmy Butler',
    'jimmy buckets': 'Jimmy Butler',
    'zion': 'Zion Williamson',
    'bi': 'Brandon Ingram',
    'kat': 'Karl-Anthony Towns',
    'towns': 'Karl-Anthony Towns',
    'bam': 'Bam Adebayo',
    'kyrie': 'Kyrie Irving',
    'uncle drew': 'Kyrie Irving',
  };
  
  // Check nickname first
  const lowerName = name.toLowerCase().trim();
  if (nicknames[lowerName]) {
    name = nicknames[lowerName];
  }
  
  // Get all players
  const allPlayers = await db.select().from(players);
  
  // Fuzzy match
  const matches = extract(name, allPlayers.map(p => p.name));
  
  if (matches.length > 0 && matches[0][1] >= 70) {
    const matchedName = matches[0][0];
    const player = allPlayers.find(p => p.name === matchedName);
    
    if (player) {
      return {
        id: player.id,
        name: player.name,
        team: player.team || 'Free Agent',
        overall: player.overall
      };
    }
  }
  
  return null;
}

/**
 * Get current bidding window ID and status
 * Windows: 12:00 AM - 11:49 AM EST (AM), 12:00 PM - 11:49 PM EST (PM)
 */
export function getCurrentBiddingWindow(): { windowId: string; startTime: Date; endTime: Date; isLocked: boolean } {
  const now = new Date();
  
  // Convert to EST (UTC-5)
  const estOffset = -5 * 60; // minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const estTime = new Date(utcTime + (estOffset * 60000));
  
  const hour = estTime.getHours();
  const minute = estTime.getMinutes();
  
  const year = estTime.getFullYear();
  const month = String(estTime.getMonth() + 1).padStart(2, '0');
  const day = String(estTime.getDate()).padStart(2, '0');
  
  let windowId: string;
  let startTime: Date;
  let endTime: Date;
  let isLocked: boolean;
  
  if (hour < 12) {
    // AM window: 12:00 AM - 11:49 AM
    windowId = `${year}-${month}-${day}-AM`;
    startTime = new Date(estTime);
    startTime.setHours(0, 0, 0, 0);
    endTime = new Date(estTime);
    endTime.setHours(11, 49, 59, 999);
    isLocked = (hour === 11 && minute >= 50) || hour >= 12;
  } else {
    // PM window: 12:00 PM - 11:49 PM
    windowId = `${year}-${month}-${day}-PM`;
    startTime = new Date(estTime);
    startTime.setHours(12, 0, 0, 0);
    endTime = new Date(estTime);
    endTime.setHours(23, 49, 59, 999);
    isLocked = (hour === 23 && minute >= 50);
  }
  
  return { windowId, startTime, endTime, isLocked };
}

/**
 * Record or update a bid in the database
 * If the same user bids on the same player in the same window, update their bid
 */
export async function recordBid(
  playerName: string,
  playerId: string | null,
  bidderDiscordId: string,
  bidderName: string,
  team: string,
  bidAmount: number,
  windowId: string,
  messageId: string
): Promise<{ success: boolean; previousHighestBidder?: { discordId: string; name: string; amount: number } }> {
  const db = await getDb();
  if (!db) return { success: false };
  
  try {
    // Check if this user already has a bid on this player in this window
    const existingBid = await db
      .select()
      .from(faBids)
      .where(
        and(
          eq(faBids.playerName, playerName),
          eq(faBids.bidderDiscordId, bidderDiscordId),
          eq(faBids.windowId, windowId)
        )
      )
      .limit(1);
    
    if (existingBid.length > 0) {
      // Update existing bid
      await db
        .update(faBids)
        .set({
          bidAmount,
          messageId,
          updatedAt: new Date()
        })
        .where(eq(faBids.id, existingBid[0].id));
      
      console.log(`[FA Bids] Updated bid: ${bidderName} (${team}) bid $${bidAmount} on ${playerName}`);
    } else {
      // Insert new bid
      await db.insert(faBids).values({
        playerId,
        playerName,
        bidderDiscordId,
        bidderName,
        team,
        bidAmount,
        windowId,
        messageId
      });
      
      console.log(`[FA Bids] New bid: ${bidderName} (${team}) bid $${bidAmount} on ${playerName}`);
    }
    
    // Check if this bid is now the highest for this player
    const allBidsForPlayer = await db
      .select()
      .from(faBids)
      .where(
        and(
          eq(faBids.playerName, playerName),
          eq(faBids.windowId, windowId)
        )
      )
      .orderBy(sql`${faBids.bidAmount} DESC`);
    
    // Find previous highest bidder (not the current bidder)
    let previousHighestBidder: { discordId: string; name: string; amount: number } | undefined;
    
    if (allBidsForPlayer.length > 1) {
      // Find highest bid that's not from current bidder
      const otherBids = allBidsForPlayer.filter(b => b.bidderDiscordId !== bidderDiscordId);
      if (otherBids.length > 0 && bidAmount > otherBids[0].bidAmount) {
        // Current bid is higher than previous highest
        previousHighestBidder = {
          discordId: otherBids[0].bidderDiscordId,
          name: otherBids[0].bidderName || 'Unknown',
          amount: otherBids[0].bidAmount
        };
      }
    }
    
    return { success: true, previousHighestBidder };
  } catch (error) {
    console.error('[FA Bids] Failed to record bid:', error);
    return { success: false };
  }
}

/**
 * Get all active bids for current window (highest bid per player)
 * Special handling: Include previous window (2025-11-14-PM) until noon EST on 2025-11-15
 */
export async function getActiveBids(windowId: string): Promise<Array<{ playerName: string; team: string; bidAmount: number; bidderName: string }>> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    // Special window handling: Include previous window's unprocessed bids
    const now = new Date();
    const noonEST = new Date('2025-11-15T12:00:00-05:00');
    const includePreviousWindow = now < noonEST;
    
    let allBids;
    
    if (includePreviousWindow) {
      // Include bids from both current window AND previous window (2025-11-14-PM)
      console.log('[FA Bids] Special window: Including bids from 2025-11-14-PM and current window');
      allBids = await db
        .select()
        .from(faBids)
        .where(
          sql`${faBids.windowId} IN ('2025-11-14-PM', ${windowId})`
        )
        .orderBy(sql`${faBids.bidAmount} DESC`);
    } else {
      // Normal operation: only current window
      allBids = await db
        .select()
        .from(faBids)
        .where(eq(faBids.windowId, windowId))
        .orderBy(sql`${faBids.bidAmount} DESC`);
    }
    
    // Group by player and keep highest bid
    const highestBids = new Map<string, typeof allBids[0]>();
    
    for (const bid of allBids) {
      const existing = highestBids.get(bid.playerName);
      if (!existing || bid.bidAmount > existing.bidAmount) {
        highestBids.set(bid.playerName, bid);
      }
    }
    
    // Filter out players who have already been processed (have a completed transaction)
    const { faTransactions } = await import('../drizzle/schema');
    const playerNames = Array.from(highestBids.keys());
    
    const processedTransactions = await db
      .select({ signPlayer: faTransactions.signPlayer })
      .from(faTransactions)
      .where(
        sql`LOWER(${faTransactions.signPlayer}) IN (${sql.join(playerNames.map(n => sql`LOWER(${n})`), sql`, `)})`
      );
    
    const processedPlayerNames = new Set(
      processedTransactions
        .filter(t => t.signPlayer)
        .map(t => t.signPlayer!.toLowerCase())
    );
    
    // Only return bids for players that haven't been processed yet
    const activeBids = Array.from(highestBids.values()).filter(bid => {
      const isProcessed = processedPlayerNames.has(bid.playerName.toLowerCase());
      if (isProcessed) {
        console.log(`[FA Bids] Excluding already-processed player: ${bid.playerName}`);
      }
      return !isProcessed;
    });
    
    return activeBids.map(bid => ({
      playerName: bid.playerName,
      team: bid.team,
      bidAmount: bid.bidAmount,
      bidderName: bid.bidderName || 'Unknown'
    }));
  } catch (error) {
    console.error('[FA Bids] Failed to get active bids:', error);
    return [];
  }
}

/**
 * Parse status update message and import existing bids
 * Format:
 * Player Name
 * Bid: X
 * Leader: username (Team)
 */
export async function importBidsFromStatusMessage(messageContent: string, windowId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  let importedCount = 0;
  const lines = messageContent.split('\n');
  
  let currentPlayer: string | null = null;
  let currentBid: number | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is a bid amount line
    const bidMatch = line.match(/^Bid:\s*(\d+)/);
    if (bidMatch && currentPlayer) {
      currentBid = parseInt(bidMatch[1]);
      console.log(`[FA Bids Import] Found bid: ${currentPlayer} = $${currentBid}`);
      continue;
    }
    
    // Check if this is a leader line
    const leaderMatch = line.match(/^Leader:\s*(?:⚠️\s*TIE\s*between\s*)?([^(]+)\s*\(([^)]+)\)/);
    if (leaderMatch && currentPlayer && currentBid !== null) {
      const bidderName = leaderMatch[1].trim().split(' & ')[0]; // Take first name if tie
      const team = leaderMatch[2].trim();
      
      try {
        // Import bid directly (no duplicate check since this only runs once on startup)
        await db.insert(faBids).values({
          playerId: null,
          playerName: currentPlayer,
          bidderDiscordId: 'imported',
          bidderName,
          team,
          bidAmount: currentBid,
          windowId,
          messageId: MIN_BID_MESSAGE_ID
        });
        
        importedCount++;
        console.log(`[FA Bids] ✅ Imported: ${currentPlayer} - $${currentBid} by ${bidderName} (${team})`);
      } catch (error) {
        console.error(`[FA Bids] ❌ Failed to import bid for ${currentPlayer}:`, error);
      }
      
      // Reset for next player
      currentPlayer = null;
      currentBid = null;
      continue;
    }
    
    // Check if this line is a player name (not empty, not a section header, not "Bid:", not "Leader:")
    if (line && 
        !line.startsWith('Bid:') && 
        !line.startsWith('Leader:') &&
        !line.startsWith('History:') &&
        !line.startsWith('Tie-breaker:') &&
        !line.includes('📊') &&
        !line.includes('🏆') &&
        !line.includes('💰') &&
        !line.includes('---') &&
        !line.includes('@everyone') &&
        !line.includes('2kleague') &&
        !line.includes('Updated as of') &&
        !line.includes('Total coins') &&
        !line.match(/^\d+\s*-\s*/) && // Skip "100 - username" lines
        !line.includes('Today at')) {
      // This might be a player name
      currentPlayer = line;
    }
  }
  
  console.log(`[FA Bids] Imported ${importedCount} bids from status message`);
  return importedCount;
}

/**
 * Validate if a team has enough coins for a new bid
 */
export async function validateBidCoins(
  bidderName: string,
  team: string,
  newBidAmount: number
): Promise<{
  valid: boolean;
  available: number;
  required: number;
  currentBids: Array<{ playerName: string; bidAmount: number }>;
}> {
  const { teamCoins } = await import('../drizzle/schema');
  const db = await getDb();
  
  if (!db) {
    throw new Error('Database not available');
  }
  
  // Get team's available coins
  const teamCoinData = await db
    .select()
    .from(teamCoins)
    .where(eq(teamCoins.team, team))
    .limit(1);
  
  if (teamCoinData.length === 0) {
    // Team not found, default to 100 coins
    console.log(`[FA Bids] Team ${team} not found in team_coins, defaulting to 100`);
    return {
      valid: newBidAmount <= 100,
      available: 100,
      required: newBidAmount,
      currentBids: []
    };
  }
  
  const available = teamCoinData[0].coinsRemaining;
  
  // Get all current active bids for this bidder
  const window = getCurrentBiddingWindow();
  const currentBids = await getActiveBids(window.windowId);
  const bidderBids = currentBids.filter(bid => bid.bidderName === bidderName);
  
  // Calculate total commitment
  const currentCommitment = bidderBids.reduce((sum: number, bid: any) => sum + bid.bidAmount, 0);
  const totalRequired = currentCommitment + newBidAmount;
  
  return {
    valid: totalRequired <= available,
    available,
    required: totalRequired,
    currentBids: bidderBids.map((b: any) => ({
      playerName: b.playerName,
      bidAmount: b.bidAmount
    }))
  };
}
