import { getDb } from './db';
import { faBids, bidWindows, teamAssignments } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { findPlayerByFuzzyName } from './fa-bid-parser';

interface UpdateBidResult {
  success: boolean;
  message?: string;
  playerName?: string;
  team?: string;
}

/**
 * Update bid amount for an existing bid
 */
export async function updateBidAmount(
  discordUserId: string,
  playerName: string,
  newBidAmount: number
): Promise<UpdateBidResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    // Get user's team assignment
    const [assignment] = await db
      .select()
      .from(teamAssignments)
      .where(eq(teamAssignments.discordUserId, discordUserId))
      .limit(1);

    if (!assignment) {
      return { success: false, message: 'You are not assigned to a team. Contact an admin.' };
    }

    const team = assignment.team;

    // Find player by fuzzy name matching
    const resolvedPlayer = await findPlayerByFuzzyName(playerName, 'bid_update');
    if (!resolvedPlayer) {
      return { success: false, message: `Player "${playerName}" not found in database.` };
    }

    // Get current active window
    const [currentWindow] = await db
      .select()
      .from(bidWindows)
      .where(eq(bidWindows.status, 'active'))
      .orderBy(desc(bidWindows.startTime))
      .limit(1);

    if (!currentWindow) {
      return { success: false, message: 'No active bidding window found.' };
    }

    // Find existing bid for this team and player in current window
    const [existingBid] = await db
      .select()
      .from(faBids)
      .where(
        and(
          eq(faBids.windowId, currentWindow.windowId),
          eq(faBids.team, team),
          eq(faBids.playerName, resolvedPlayer.name)
        )
      )
      .limit(1);

    if (!existingBid) {
      return {
        success: false,
        message: `No existing bid found for ${resolvedPlayer.name}. Use the regular bid format to create a new bid.`
      };
    }

    // Update bid amount
    await db
      .update(faBids)
      .set({
        bidAmount: newBidAmount,
        updatedAt: new Date()
      })
      .where(eq(faBids.id, existingBid.id));

    console.log(`[Update Bid] ${team} updated bid for ${resolvedPlayer.name}: $${existingBid.bidAmount} → $${newBidAmount}`);

    return {
      success: true,
      playerName: resolvedPlayer.name,
      team: team
    };
  } catch (error) {
    console.error('[Update Bid] Error:', error);
    return { success: false, message: 'An error occurred while updating the bid.' };
  }
}
