import type { Message, ButtonInteraction } from 'discord.js';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDb } from './db';
import { validateTeamName } from './team-validator';
import { players, teamCoins, faTransactions } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { extract } from 'fuzzball';
import { handleTradeMessage } from './trade-handler';

const FA_CHANNEL_ID = '1095812920056762510';
const TRADE_CHANNEL_ID = '1087524540634116116';
const GUILD_ID = '860782751656837140';
const MIN_MESSAGE_ID = '1438598608533454889'; // Only process bid messages after this status update

interface ParsedTransaction {
  dropPlayer: string;
  signPlayer: string;
  signPlayerOvr?: number;
  bidAmount: number; // Default to 1 if not specified
  detectedTeam?: string;
}

let client: Client | null = null;
let pendingTransactions: ParsedTransaction[] = [];

/**
 * Parse FA transaction message
 * Flexible format: handles variations of cut/drop/release and sign/add/pickup
 * Examples:
 * - "Cut: Player A\nSign: Player B, OVR\nBid: X"
 * - "Drop Player A. Add Player B. Bid X"
 * - "Cutting Player A, signing Player B, 5 coins"
 */
function parseTransaction(message: string): ParsedTransaction | null {
  // Remove extra whitespace and normalize
  const text = message.trim();
  
  // Flexible patterns for cut/drop
  const cutPattern = /(?:cut|drop|cutting|dropping|release|releasing)[:\s]+([^.\n]+?)(?:[.,]|\n|$)/i;
  const cutMatch = text.match(cutPattern);
  
  // Flexible patterns for sign/add
  const signPattern = /(?:sign|add|signing|adding|pick\s*up|pickup)[:\s]+([^.\n]+?)(?:[.,]|\n|$)/i;
  const signMatch = text.match(signPattern);
  
  // Extract OVR if present (look for number after player name or in parentheses)
  let signPlayerOvr: number | undefined;
  if (signMatch) {
    const ovrMatch = text.match(/(?:sign|add)[^.\n]*?(?:,\s*(\d+)|\((\d+)\))/i);
    if (ovrMatch) {
      signPlayerOvr = parseInt(ovrMatch[1] || ovrMatch[2]);
    }
  }
  
  // Flexible pattern for bid
  const bidPattern = /(?:bid|bidding)[:\s]*(\d+)|(?:^|\s)(\d+)\s*coins?/i;
  const bidMatch = text.match(bidPattern);
  
  if (cutMatch && signMatch) {
    const dropPlayer = cutMatch[1].trim().replace(/[,.:;]$/, ''); // Remove trailing punctuation
    let signPlayer = signMatch[1].trim().replace(/[,.:;]$/, '');
    
    // Remove OVR from player name if it was captured
    signPlayer = signPlayer.replace(/,?\s*\d+$/, '').replace(/\(\d+\)/, '').trim();
    
    const bidAmount = bidMatch ? parseInt(bidMatch[1] || bidMatch[2]) : 1; // Default to 1 if not specified
    
    return {
      dropPlayer,
      signPlayer,
      signPlayerOvr,
      bidAmount
    };
  }
  
  return null;
}

/**
 * Find player by fuzzy name matching
 */
async function findPlayerByName(name: string): Promise<{ id: string; name: string; team: string; overall: number } | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Get all players
  const allPlayers = await db.select().from(players);
  
  // Fuzzy match player names
  const matches = extract(name, allPlayers.map(p => p.name), { limit: 1, cutoff: 70 });
  
  if (matches.length > 0) {
    const matchedName = matches[0][0];
    const player = allPlayers.find(p => p.name === matchedName);
    if (player && player.team) {
      return {
        id: player.id,
        name: player.name,
        team: player.team,
        overall: player.overall
      };
    }
  }
  
  return null;
}

/**
 * Get or create team coins record
 */
async function getTeamCoins(team: string): Promise<{ coinsRemaining: number }> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Validate team name before proceeding
  const { isValidTeam } = await import('./team-validator');
  if (!isValidTeam(team)) {
    throw new Error(`Invalid team name: ${team}. Only the 28 league teams + Free Agents are allowed.`);
  }
  
  // Check if team coins record exists
  const existing = await db.select().from(teamCoins).where(eq(teamCoins.team, team));
  
  if (existing.length > 0) {
    return { coinsRemaining: existing[0].coinsRemaining };
  }
  
  // Initialize team coins (default 100, Nuggets/Hawks get 115)
  const initialCoins = (team === 'Nuggets' || team === 'Hawks') ? 115 : 100;
  await db.insert(teamCoins).values({ team, coinsRemaining: initialCoins });
  
  return { coinsRemaining: initialCoins };
}

/**
 * Check if team is over cap
 */
async function isTeamOverCap(team: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Get all players on team
  const teamPlayers = await db.select().from(players).where(eq(players.team, team));
  
  // Calculate total cap (use salaryCap if set, otherwise use overall)
  const totalCap = teamPlayers.reduce((sum, p) => sum + (p.salaryCap || p.overall), 0);
  
  return totalCap > 1098;
}

/**
 * Process approved transactions with roster-based team detection and coin tracking
 */
async function processTransactions(transactions: ParsedTransaction[], adminUser: string): Promise<{ success: number; failed: number; details: string[]; coinSummary: Map<string, number> }> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  let success = 0;
  let failed = 0;
  const details: string[] = [];
  const coinSummary = new Map<string, number>();
  
  for (const transaction of transactions) {
    try {
      // Find dropped player to detect team
      const droppedPlayer = await findPlayerByName(transaction.dropPlayer);
      
      if (!droppedPlayer) {
        failed++;
        details.push(`❌ ${transaction.dropPlayer} not found in database`);
        console.log(`[Discord Bot] Dropped player not found: ${transaction.dropPlayer}`);
        continue;
      }
      
      const team = droppedPlayer.team;
      
      // Find signed player
      const signedPlayer = await findPlayerByName(transaction.signPlayer);
      
      if (!signedPlayer) {
        failed++;
        details.push(`❌ ${transaction.signPlayer} not found in database`);
        console.log(`[Discord Bot] Signed player not found: ${transaction.signPlayer}`);
        continue;
      }
      
      // Get team coins
      const teamCoinsData = await getTeamCoins(team);
      let bidAmount = transaction.bidAmount;
      
      // Apply 70 OVR exception: if team is over cap and signed player is exactly 70 OVR, bid = 0
      const overCap = await isTeamOverCap(team);
      if (overCap && signedPlayer.overall === 70) {
        bidAmount = 0;
        details.push(`🟢 ${team}: 70 OVR exception applied (0 coins)`);
      }
      
      // Check if team has enough coins
      if (teamCoinsData.coinsRemaining < bidAmount) {
        failed++;
        details.push(`❌ ${team}: Insufficient coins (${teamCoinsData.coinsRemaining} remaining, ${bidAmount} needed)`);
        console.log(`[Discord Bot] ${team}: Insufficient coins`);
        continue;
      }
      
      // Enforce 70 OVR restriction: teams with 0 coins cannot sign players > 70 OVR
      if (teamCoinsData.coinsRemaining === 0 && signedPlayer.overall > 70) {
        failed++;
        details.push(`❌ ${team}: Cannot sign ${signedPlayer.name} (${signedPlayer.overall} OVR) - teams with 0 coins can only sign 70 OVR or lower`);
        console.log(`[Discord Bot] ${team}: 70 OVR restriction violated`);
        continue;
      }
      
      // Deduct coins
      const newCoinsRemaining = teamCoinsData.coinsRemaining - bidAmount;
      await db
        .update(teamCoins)
        .set({ coinsRemaining: newCoinsRemaining })
        .where(eq(teamCoins.team, team));
      
      // Validate team name
      const validTeam = validateTeamName(team);
      if (!validTeam) {
        console.error(`[FA Transactions] Invalid team name: ${team}`);
        continue; // Skip this transaction
      }
      
      // Update both players
      await db
        .update(players)
        .set({ team: 'Free Agents' })
        .where(eq(players.id, droppedPlayer.id));
      
      await db
        .update(players)
        .set({ team: validTeam })
        .where(eq(players.id, signedPlayer.id));
      
      // Log transaction
      await db.insert(faTransactions).values({
        team,
        dropPlayer: droppedPlayer.name,
        signPlayer: signedPlayer.name,
        signPlayerOvr: signedPlayer.overall,
        bidAmount,
        adminUser,
        coinsRemaining: newCoinsRemaining
      });
      
      success++;
      coinSummary.set(team, newCoinsRemaining);
      details.push(`✅ ${team}: Dropped ${droppedPlayer.name}, Signed ${signedPlayer.name} (${bidAmount} coins, ${newCoinsRemaining} remaining)`);
      console.log(`[Discord Bot] ${team}: Dropped ${droppedPlayer.name}, Signed ${signedPlayer.name} (${bidAmount} coins)`);
    } catch (error) {
      failed++;
      details.push(`❌ Error processing transaction`);
      console.error(`[Discord Bot] Failed to process transaction:`, error);
    }
  }
  
  // Update overcap roles after roster changes
  if (success > 0 && client) {
    try {
      const { updateOvercapRoles } = await import('./overcap-roles');
      await updateOvercapRoles(client);
      console.log('[Discord Bot] Overcap roles updated after transactions');
    } catch (error) {
      console.error('[Discord Bot] Failed to update overcap roles:', error);
    }
  }
  
  return { success, failed, details, coinSummary };
}

/**
 * Handle message in FA channel
 */
async function handleFAMessage(message: Message) {
  console.log(`[Discord Bot] Received message in FA channel (ID: ${message.id}): ${message.content.substring(0, 100)}`);
  
  // Ignore bot messages
  if (message.author.bot) {
    console.log(`[Discord Bot] Ignoring bot message`);
    return;
  }
  
  console.log(`[Discord Bot] Attempting to parse message...`);
  
  // Parse the message
  const transaction = parseTransaction(message.content);
  if (!transaction) {
    console.log(`[Discord Bot] Failed to parse transaction from message`);
    return;
  }
  console.log(`[Discord Bot] Successfully parsed transaction:`, transaction);
  
  // Detect team from dropped player's current roster
  const droppedPlayer = await findPlayerByName(transaction.dropPlayer);
  if (droppedPlayer) {
    transaction.detectedTeam = droppedPlayer.team;
  }
  
  // Add to pending transactions
  pendingTransactions.push(transaction);
  
  console.log(`[Discord Bot] Detected transaction: ${transaction.dropPlayer} out, ${transaction.signPlayer} in (Team: ${transaction.detectedTeam || 'Unknown'})`);
  
  // Send confirmation request after a short delay (batch multiple transactions)
  setTimeout(async () => {
    if (pendingTransactions.length === 0) return;
    
    const transactionsToProcess = [...pendingTransactions];
    pendingTransactions = [];
    
    // Create confirmation message with detected teams and bid amounts
    const transactionList = transactionsToProcess
      .map((t, i) => {
        const teamInfo = t.detectedTeam ? `[${t.detectedTeam}]` : '[Team Unknown - WILL FAIL]';
        const ovrInfo = t.signPlayerOvr ? ` (${t.signPlayerOvr} OVR)` : '';
        return `${i + 1}. ${teamInfo} Drop: ${t.dropPlayer}, Sign: ${t.signPlayer}${ovrInfo}, Bid: ${t.bidAmount} coins`;
      })
      .join('\n');
    
    const hasUnknownTeams = transactionsToProcess.some(t => !t.detectedTeam);
    const warningText = hasUnknownTeams ? '\n\n⚠️ **Warning:** Some transactions have unknown teams (dropped player not found). These will fail during processing.' : '';
    
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_transactions')
      .setLabel('✅ Confirm & Process')
      .setStyle(ButtonStyle.Success);
    
    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_transactions')
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(confirmButton, cancelButton);
    
    // Check if channel is text-based and has send method
    if (!('send' in message.channel)) return;
    
    const confirmMessage = await message.channel.send({
      content: `🤖 **FA Transaction Confirmation**\n\nDetected ${transactionsToProcess.length} transaction(s):\n\`\`\`\n${transactionList}\n\`\`\`${warningText}\n\nShould I process these transactions?`,
      components: [row]
    });
    
    // Store transactions with message ID for later processing
    const collector = confirmMessage.createMessageComponentCollector({
      time: 300000 // 5 minutes
    });
    
    collector.on('collect', async (interaction: ButtonInteraction) => {
      if (interaction.customId === 'confirm_transactions') {
        await interaction.update({
          content: `⏳ Processing ${transactionsToProcess.length} transactions...`,
          components: []
        });
        
        const result = await processTransactions(transactionsToProcess, interaction.user.tag);
        
        const detailsText = result.details.join('\n');
        
        // Build coin summary
        const coinSummaryText = Array.from(result.coinSummary.entries())
          .map(([team, coins]) => `${team}: ${coins} coins remaining`)
          .join('\n');
        
        await interaction.editReply({
          content: `✅ **Transactions Processed**\n\n${detailsText}\n\n**Summary:** ✅ ${result.success} successful, ❌ ${result.failed} failed\n\n**💰 Coin Status:**\n${coinSummaryText}`
        });
        
        collector.stop();
      } else if (interaction.customId === 'cancel_transactions') {
        await interaction.update({
          content: `❌ Transactions cancelled by ${interaction.user.tag}`,
          components: []
        });
        
        collector.stop();
      }
    });
    
    collector.on('end', () => {
      if (confirmMessage.editable) {
        confirmMessage.edit({ components: [] }).catch(() => {});
      }
    });
  }, 2000); // 2 second delay to batch transactions
}

/**
 * Handle FA bid message - parse and record bids
 */
async function handleBidMessage(message: Message) {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only process messages after the status update threshold
  if (message.id <= MIN_MESSAGE_ID) {
    return;
  }
  
  console.log(`[FA Bids] Checking message ${message.id}: ${message.content.substring(0, 50)}...`);
  
  // Try to parse as bid
  const { parseBidMessage, findPlayerByFuzzyName, getCurrentBiddingWindow, recordBid } = await import('./fa-bid-parser');
  const parsedBid = parseBidMessage(message.content);
  
  if (!parsedBid) {
    return; // Not a valid bid message
  }
  
  console.log(`[FA Bids] Parsed bid:`, parsedBid);
  
  // Get current bidding window
  const window = getCurrentBiddingWindow();
  
  if (window.isLocked) {
    console.log(`[FA Bids] Window ${window.windowId} is locked, ignoring bid`);
    return;
  }
  
  // Determine team from Discord user ID (reliable, doesn't depend on nicknames)
  const db = await getDb();
  if (!db) {
    console.log(`[FA Bids] Database not available`);
    await message.reply(`❌ **Database Error**: Unable to process bid at this time.`);
    return;
  }
  
  const { teamAssignments } = await import('../drizzle/schema');
  const teamAssignment = await db.select().from(teamAssignments).where(eq(teamAssignments.discordUserId, message.author.id));
  
  if (teamAssignment.length === 0) {
    console.log(`[FA Bids] User ${message.author.username} (${message.author.id}) has no team assignment`);
    await message.reply(
      `❌ **No Team Assignment**: Your Discord account is not assigned to a team.\n\n` +
      `💡 **Contact an admin** to get assigned to a team.`
    );
    return;
  }
  
  let team = teamAssignment[0].team;
  console.log(`[FA Bids] User ${message.author.username} is assigned to team: ${team}`);
  
  // Validate team name using team-validator
  const { validateTeamName } = await import('./team-validator');
  const validatedTeam = validateTeamName(team);
  
  if (!validatedTeam) {
    console.log(`[FA Bids] Invalid team in assignment: ${team}`);
    await message.reply(
      `❌ **Invalid Team Assignment**: Your team "${team}" is not valid.\n\n` +
      `💡 **Contact an admin** to fix your team assignment.`
    );
    return;
  }
  
  team = validatedTeam;
  
  // Validate drop player if specified (verify they're on the user's team)
  let dropPlayerValidated: { id: string; name: string; team: string; overall: number; salaryCap?: number | null } | null = null;
  
  if (parsedBid.dropPlayer) {
    // Validate drop player exists (no team context yet, no FA filter)
    dropPlayerValidated = await findPlayerByFuzzyName(parsedBid.dropPlayer, undefined, false);
    
    if (!dropPlayerValidated) {
      console.log(`[FA Bids] Drop player not found: ${parsedBid.dropPlayer}`);
      
      // Get suggestions for similar player names
      const { getDb } = await import('./db');
      const { players: playersTable } = await import('../drizzle/schema');
      const db = await getDb();
      if (db) {
        const allPlayers = await db.select({ name: playersTable.name }).from(playersTable);
        const { extract } = await import('fuzzball');
        const suggestions = extract(parsedBid.dropPlayer, allPlayers.map(p => p.name), { limit: 3 });
        
        const suggestionText = suggestions.length > 0
          ? `\n\n**Did you mean?**\n${suggestions.map(s => `• ${s[0]} (${s[1]}% match)`).join('\n')}`
          : '';
        
        await message.reply(
          `❌ **Drop Player Not Found**: "${parsedBid.dropPlayer}" does not exist in the database.${suggestionText}\n\n` +
          `💡 **Tip**: Make sure the player you're cutting is spelled correctly.`
        );
      }
      return;
    }
    
    team = dropPlayerValidated.team || 'Unknown';
    
    // Validate team name using team-validator
    const { validateTeamName } = await import('./team-validator');
    const validatedTeam = validateTeamName(team);
    
    if (!validatedTeam) {
      console.log(`[FA Bids] Invalid team detected: ${team}`);
      
      // Get suggestions for similar team names
      const { VALID_TEAMS } = await import('./team-validator');
      const { extract } = await import('fuzzball');
      const suggestions = extract(team, VALID_TEAMS as unknown as string[], { limit: 3 });
      
      const suggestionText = suggestions.length > 0
        ? `\n\n**Did you mean?**\n${suggestions.map(s => `• ${s[0]} (${s[1]}% match)`).join('\n')}`
        : '';
      
      await message.reply(
        `❌ **Invalid Team**: "${team}" is not a valid team name.${suggestionText}\n\n` +
        `💡 **Tip**: Check the team name spelling. The bot recognizes aliases like "76ers" → "Sixers", "Blazers" → "Trail Blazers".`
      );
      return;
    }
    
    // Use validated canonical team name
    team = validatedTeam;
  } else {
    // No drop player specified - cannot determine team
    await message.reply(
      `❌ **Missing Drop Player**: You must specify which player to cut.\n\n` +
      `💡 **Format**: "Cut [Player Name] Sign [Player Name] Bid [Amount]"\n` +
      `**Example**: "Cut Chris Paul Sign Rocco Zikarsky Bid 104"`
    );
    return;
  }
  
  // Now find sign player by fuzzy matching (filter for free agents only, use team context)
  const player = await findPlayerByFuzzyName(parsedBid.playerName, team, true);
  
  if (!player) {
    console.log(`[FA Bids] Player not found: ${parsedBid.playerName}`);
    
    // Get suggestions for similar player names
    const { getDb } = await import('./db');
    const { players: playersTable } = await import('../drizzle/schema');
    const db = await getDb();
    if (db) {
      const allPlayers = await db.select({ name: playersTable.name }).from(playersTable);
      const { extract } = await import('fuzzball');
      const suggestions = extract(parsedBid.playerName, allPlayers.map(p => p.name), { limit: 3 });
      
      const suggestionText = suggestions.length > 0
        ? `\n\n**Did you mean?**\n${suggestions.map(s => `• ${s[0]} (${s[1]}% match)`).join('\n')}`
        : '';
      
      await message.reply(
        `❌ **Player Not Found**: "${parsedBid.playerName}" does not exist in the database.${suggestionText}\n\n` +
        `💡 **Tip**: Check spelling or use common nicknames (e.g., "LeBron", "Steph", "KD").`
      );
    }
    return;
  }
  
  console.log(`[FA Bids] Matched player: ${player.name} (${player.overall} OVR)`);
  
  // Check if player is actually a free agent
  const isFreeAgent = !player.team || player.team === 'Free Agent' || player.team === 'Free Agents';
  if (!isFreeAgent) {
    console.log(`[FA Bids] ❌ ${player.name} is not a free agent (currently on ${player.team})`);
    await message.reply(`❌ **Invalid Bid**: ${player.name} is not a free agent. They are currently on the ${player.team}.`);
    return;
  }
  
  // Check if team is over cap and trying to sign 71+ OVR player
  const { isTeamOverCap } = await import('./cap-violation-alerts');
  const overCap = await isTeamOverCap(team);
  
  if (overCap && player.overall > 70) {
    console.log(`[FA Bids] ❌ Over-cap restriction: ${team} cannot sign ${player.name} (${player.overall} OVR)`);
    await message.reply(
      `❌ **Over-Cap Restriction**

` +
      `${team} is currently **over the 1098 overall cap** and cannot sign players with **71+ overall rating**.

` +
      `**Player**: ${player.name} (${player.overall} OVR)
` +
      `**Restriction**: Over-cap teams may only sign players with **70 or lower overall** to reduce cap burden.

` +
      `💡 **Tip**: Focus on signing lower-rated players (≤70 OVR) to get back under the cap limit.`
    );
    return;
  }
  
  // Validate coin commitment
  const { validateBidCoins } = await import('./fa-bid-parser');
  const validation = await validateBidCoins(
    message.author.username,
    team,
    parsedBid.bidAmount
  );
  
  if (!validation.valid) {
    console.log(`[FA Bids] ❌ Insufficient coins: ${team} has ${validation.available} coins, needs ${validation.required}`);
    await message.reply(
      `❌ **Insufficient Coins**: ${team} has **${validation.available}** coins remaining.\n` +
      `This bid ($${parsedBid.bidAmount}) would bring your total commitment to **$${validation.required}**, which exceeds your budget.\n\n` +
      `💰 Current commitments:\n${validation.currentBids.map((b: any) => `• ${b.playerName}: $${b.bidAmount}`).join('\n')}`
    );
    return;
  }
  
  // Record the bid
  const bidResult = await recordBid(
    player.name,
    player.id,
    message.author.id,
    message.author.username,
    team,
    parsedBid.bidAmount,
    window.windowId,
    message.id,
    parsedBid.dropPlayer
  );
  
  if (!bidResult.success) {
    console.error(`[FA Bids] Failed to record bid`);
    return;
  }
  
  console.log(`[FA Bids] ✅ Bid recorded: ${message.author.username} (${team}) bid $${parsedBid.bidAmount} on ${player.name}`);
  
  // Send outbid notification if someone was outbid
  if (bidResult.previousHighestBidder) {
    const { checkAndNotifyOutbid } = await import('./outbid-notifications');
    await checkAndNotifyOutbid(
      client!,
      player.name,
      message.author.id,
      parsedBid.bidAmount,
      window.windowId
    );
  }
  
  // Get all bids for this player to show current status
  const { getActiveBids } = await import('./fa-bid-parser');
  const activeBids = await getActiveBids(window.windowId);
  const playerBids = activeBids.filter(b => b.playerName === player.name);
  const highestBid = playerBids.length > 0 ? playerBids[0] : null;
  
  // Send confirmation message
  let confirmationMessage = `✅ **Bid Confirmed**\n\n`;
  
  // Add cut player info if present
  if (parsedBid.dropPlayer) {
    const droppedPlayer = await findPlayerByFuzzyName(parsedBid.dropPlayer);
    if (droppedPlayer) {
      confirmationMessage += `**Cut**: ${droppedPlayer.name} (${droppedPlayer.overall} OVR)\n`;
    } else {
      confirmationMessage += `**Cut**: ${parsedBid.dropPlayer}\n`;
    }
  }
  
  confirmationMessage += `**Sign**: ${player.name} (${player.overall} OVR)\n`;
  confirmationMessage += `**Your bid**: $${parsedBid.bidAmount}\n`;
  confirmationMessage += `**Team**: ${team}\n`;
  
  // Calculate and show cap projection (db already initialized above)
  if (db) {
    const teamPlayers = await db
      .select()
      .from(players)
      .where(eq(players.team, team));
    
    const currentTotal = teamPlayers.reduce((sum, p) => sum + (p.salaryCap || p.overall), 0);
    let projectedTotal = currentTotal;
    
    // Subtract dropped player if present (use already-validated drop player)
    if (dropPlayerValidated) {
      const dropPlayerCap = dropPlayerValidated.salaryCap || dropPlayerValidated.overall;
      projectedTotal -= dropPlayerCap;
    }
    
    // Add signed player (use salaryCap if available, otherwise overall)
    const signPlayerCap = player.salaryCap || player.overall;
    projectedTotal += signPlayerCap;
    
    const CAP_LIMIT = 1098;
    const capDiff = projectedTotal - CAP_LIMIT;
    const capStatus = capDiff > 0 ? `(+${capDiff})` : capDiff < 0 ? `(${capDiff})` : '(At Cap)';
    const emoji = capDiff > 0 ? '🔴' : capDiff < 0 ? '🟢' : '🟡';
    
    confirmationMessage += `**Projected cap**: ${emoji} ${projectedTotal}/${CAP_LIMIT} ${capStatus}\n\n`;
  } else {
    confirmationMessage += '\n';
  }
  
  if (highestBid && highestBid.bidderName === message.author.username) {
    confirmationMessage += `🏆 **You have the highest bid!**`;
  } else if (highestBid) {
    confirmationMessage += `⚠️ **Current leader**: ${highestBid.bidderName} (${highestBid.team}) with $${highestBid.bidAmount}\n`;
    confirmationMessage += `Place a higher bid to take the lead!`;
  } else {
    confirmationMessage += `🏆 **You're the first bidder!**`;
  }
  
  await message.reply(confirmationMessage);
  
  // Send DM notification to previous highest bidder if they were outbid
  if (bidResult.previousHighestBidder && client) {
    try {
      const previousBidder = await client.users.fetch(bidResult.previousHighestBidder.discordId);
      await previousBidder.send(
        `🚨 **You've been outbid!**\n\n` +
        `**Player**: ${player.name}\n` +
        `**Your bid**: $${bidResult.previousHighestBidder.amount}\n` +
        `**New highest bid**: $${parsedBid.bidAmount}\n` +
        `**Placed by**: ${message.author.username} (${team})\n\n` +
        `Place a higher bid to regain the lead!`
      );
      console.log(`[FA Bids] 📨 Sent overbid notification to ${bidResult.previousHighestBidder.name}`);
    } catch (error) {
      console.error(`[FA Bids] Failed to send DM to ${bidResult.previousHighestBidder.name}:`, error);
    }
  }
  
  // Check if team is now over budget and auto-cancel oldest bids
  const { autoCancelOverBudgetBids, getNextHighestBidder } = await import('./fa-auto-cancel');
  const cancelledBids = await autoCancelOverBudgetBids(team, window.windowId);
  
  if (cancelledBids.length > 0 && client) {
    // Send notifications to affected users
    for (const cancelled of cancelledBids) {
      try {
        const user = await client.users.fetch(cancelled.bidderDiscordId);
        
        // Check if there's a next highest bidder
        const nextBidder = await getNextHighestBidder(
          cancelled.playerName,
          window.windowId,
          cancelled.bidderDiscordId
        );
        
        let notificationMessage = 
          `⚠️ **Your bid was auto-cancelled**\n\n` +
          `**Player**: ${cancelled.playerName}\n` +
          `**Your bid**: $${cancelled.bidAmount}\n` +
          `**Reason**: ${team} exceeded coin budget\n\n`;
        
        if (nextBidder) {
          notificationMessage += 
            `**New leader**: ${nextBidder.name} with $${nextBidder.amount}\n\n` +
            `Place a new bid if you want to compete!`;
        } else {
          notificationMessage += `This player now has no active bids. Place a new bid to claim them!`;
        }
        
        await user.send(notificationMessage);
        console.log(`[FA Auto-Cancel] 📨 Sent cancellation notice to ${cancelled.bidderName}`);
      } catch (error) {
        console.error(`[FA Auto-Cancel] Failed to send DM to ${cancelled.bidderName}:`, error);
      }
    }
  }
}

/**
 * Start Discord bot
 */
export async function startDiscordBot(token: string) {
  if (client) {
    console.log('[Discord Bot] Already running');
    return;
  }
  
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction
    ]
  });
  
  client.on('ready', async () => {
    console.log(`[Discord Bot] Logged in as ${client?.user?.tag}`);
    console.log(`[Discord Bot] Monitoring FA channel: ${FA_CHANNEL_ID}`);
    console.log(`[Discord Bot] React with ⚡ to trigger transaction processing`);
    
    // Bid data was manually seeded, no import needed
    
    // Start hourly status updates
    try {
      const { startHourlyUpdates } = await import('./fa-status-updates');
      startHourlyUpdates(client!);
    } catch (error) {
      console.error('[FA Status] Failed to start hourly updates:', error);
    }
    
    // Initial overcap role check
    try {
      const { updateOvercapRoles, loadTeamUserMapping } = await import('./overcap-roles');
      await loadTeamUserMapping();
      await updateOvercapRoles(client!);
      console.log('[Overcap Roles] Initial role check complete');
    } catch (error) {
      console.error('[Overcap Roles] Failed initial role check:', error);
    }
    
    // Initialize trade voting system
    try {
      const { initializeTradeVoting } = await import('./trade-voting');
      initializeTradeVoting(client!);
    } catch (error) {
      console.error('[Trade Voting] Failed to initialize:', error);
    }
    
    // Initialize cap violation monitoring
    try {
      const { initializeCapViolationMonitoring } = await import('./cap-violation-alerts');
      initializeCapViolationMonitoring(client!);
    } catch (error) {
      console.error('[Cap Alerts] Failed to initialize:', error);
    }
    
    // Schedule window close summaries
    try {
      const { scheduleWindowCloseSummaries } = await import('./fa-window-close');
      scheduleWindowCloseSummaries(client!);
    } catch (error) {
      console.error('[Window Close] Failed to schedule summaries:', error);
    }
    
    // Initialize team role manager
    try {
      const { syncTeamRoles } = await import('./team-role-manager');
      await syncTeamRoles(client!);
      console.log('[Team Roles] Initial role sync complete');
    } catch (error) {
      console.error('[Team Roles] Failed to initialize:', error);
    }
    
    // Initialize team channel manager (after roles are synced)
    try {
      const { syncTeamChannels } = await import('./team-channel-manager');
      // Wait 2 seconds to ensure roles are created first
      setTimeout(async () => {
        await syncTeamChannels(client!);
        console.log('[Team Channels] Initial channel sync complete');
      }, 2000);
    } catch (error) {
      console.error('[Team Channels] Failed to initialize:', error);
    }
  });
  
  // Monitor message updates for team role sync
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    try {
      // Check if this is the team message being updated
      if (newMessage.id === '1130885281508233316' && newMessage.channelId === '860782989280935966') {
        console.log('[Team Roles] Team message updated, syncing roles...');
        const { syncTeamRoles } = await import('./team-role-manager');
        await syncTeamRoles(client!);
        
        // Also sync team channels after role sync
        setTimeout(async () => {
          const { syncTeamChannels } = await import('./team-channel-manager');
          await syncTeamChannels(client!);
        }, 1000);
      }
    } catch (error) {
      console.error('[Team Roles] Error handling message update:', error);
    }
  });
  
  // Monitor all messages for FA bids and commands
  client.on('messageCreate', async (message) => {
    if (message.channelId === FA_CHANNEL_ID) {
      // Check for update bid command: !update bid <player> <amount>
      if (message.content.trim().toLowerCase().startsWith('!update bid')) {
        const parts = message.content.trim().split(/\s+/);
        if (parts.length < 4) {
          await message.reply('❌ Usage: !update bid <player name> <amount>');
          return;
        }
        
        const bidAmount = parseInt(parts[parts.length - 1]);
        const playerName = parts.slice(2, -1).join(' ');
        
        if (isNaN(bidAmount) || bidAmount < 1) {
          await message.reply('❌ Invalid bid amount. Must be a positive number.');
          return;
        }
        
        try {
          const { updateBidAmount } = await import('./fa-bid-updater');
          const result = await updateBidAmount(message.author.id, playerName, bidAmount);
          
          if (result.success) {
            await message.reply(`✅ Updated bid for **${result.playerName}** to **$${bidAmount}** (Team: ${result.team})`);
          } else {
            await message.reply(`❌ ${result.message}`);
          }
        } catch (error) {
          console.error('[Update Bid] Command failed:', error);
          await message.reply('❌ Failed to update bid. Check logs for details.');
        }
        return;
      }
      
      // Check for manual overcap role update command
      if (message.content.trim().toLowerCase() === '!updateovercap') {
        try {
          await message.reply('🔄 Updating overcap roles...');
          const { updateOvercapRoles } = await import('./overcap-roles');
          await updateOvercapRoles(client!);
          await message.reply('✅ Overcap roles updated successfully!');
        } catch (error) {
          console.error('[Overcap Roles] Manual update failed:', error);
          await message.reply('❌ Failed to update overcap roles. Check logs for details.');
        }
        return;
      }
      
      // Check for regenerate summary command: !regenerate-summary <windowId>
      if (message.content.trim().toLowerCase().startsWith('!regenerate-summary')) {
        const parts = message.content.trim().split(/\s+/);
        const windowId = parts[1] || '2025-11-15-AM'; // Default to today's AM window
        
        try {
          await message.reply(`🔄 Regenerating summary for window ${windowId}...`);
          const { regenerateWindowSummary } = await import('./fa-window-close');
          
          const result = await regenerateWindowSummary(client!, windowId);
          
          if (result.success) {
            await message.reply(`✅ Summary regenerated successfully! Found ${result.bidCount} winning bids. React with ⚡ on the summary message to process.`);
          } else {
            await message.reply(`❌ Failed to regenerate summary: ${result.message}`);
          }
        } catch (error) {
          console.error('[Regenerate Summary] Command failed:', error);
          await message.reply('❌ Failed to regenerate summary. Check logs for details.');
        }
        return;
      }
      
      // Check for rollback command: !rollback <batchId>
      if (message.content.trim().toLowerCase().startsWith('!rollback ')) {
        const batchId = message.content.trim().substring(10).trim();
        if (!batchId) {
          await message.reply('❌ Usage: !rollback <batchId>');
          return;
        }
        
        try {
          await message.reply(`🔄 Rolling back batch ${batchId}...`);
          const { rollbackBatch } = await import('./fa-window-close');
          const { EmbedBuilder } = await import('discord.js');
          
          const result = await rollbackBatch(batchId, message.author.tag || message.author.username || 'Unknown');
          
          if (result.success && 'results' in result && result.results) {
            const successList = result.results
              .filter(r => r.success)
              .map(r => `✅ ${r.playerName} (${r.team})`)
              .join('\n') || 'None';
            
            const failList = result.results
              .filter(r => !r.success)
              .map(r => `❌ ${r.playerName} (${r.team}) - ${r.error || 'Unknown error'}`)
              .join('\n') || 'None';
            
            const embed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle('✅ Rollback Complete')
              .setDescription(`Rolled back ${result.successCount} transactions`);
            
            if (successList !== 'None') {
              embed.addFields({ name: 'Rolled Back', value: successList });
            }
            
            if (failList !== 'None') {
              embed.addFields({ name: 'Failed', value: failList });
            }
            
            embed.setFooter({ text: `Batch ID: ${batchId} | Rolled back by ${message.author.tag}` });
            
            await message.reply({ embeds: [embed] });
          } else {
            await message.reply(`❌ Rollback failed: ${result.message}`);
          }
        } catch (error) {
          console.error('[Rollback] Command failed:', error);
          await message.reply('❌ Failed to rollback batch. Check logs for details.');
        }
        return;
      }
      
      // Check for team role sync command
      if (message.content.trim().toLowerCase() === '!sync-team-roles') {
        try {
          await message.reply('🔄 Syncing team roles...');
          const { syncTeamRoles } = await import('./team-role-manager');
          await syncTeamRoles(client!);
          await message.reply('✅ Team roles synced successfully!');
        } catch (error) {
          console.error('[Team Roles] Sync command failed:', error);
          await message.reply('❌ Failed to sync team roles. Check logs for details.');
        }
        return;
      }
      
      // Check for team channel sync command
      if (message.content.trim().toLowerCase() === '!sync-team-channels') {
        try {
          await message.reply('🔄 Syncing team channels...');
          const { syncTeamChannels } = await import('./team-channel-manager');
          await syncTeamChannels(client!);
          await message.reply('✅ Team channels synced successfully!');
        } catch (error) {
          console.error('[Team Channels] Sync command failed:', error);
          await message.reply('❌ Failed to sync team channels. Check logs for details.');
        }
        return;
      }
      
      await handleBidMessage(message);
    } else if (message.channelId === TRADE_CHANNEL_ID) {
      // Handle new trade embeds for voting
      try {
        const { handleNewTradeEmbed } = await import('./trade-voting');
        await handleNewTradeEmbed(message);
      } catch (error) {
        console.error('[Trade Voting] Error handling new trade embed:', error);
      }
    }
  });
  
  // Handle emoji reactions for manual transaction and trade processing
  client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;
    
    // Handle trade voting (👍 👎)
    if (reaction.emoji.name === '👍' || reaction.emoji.name === '👎') {
      try {
        const { handleReactionAdd } = await import('./trade-voting');
        await handleReactionAdd(reaction, user);
      } catch (error) {
        console.error('[Trade Voting] Error handling reaction add:', error);
      }
      return;
    }
    
    // Process lightning bolt emoji (⚡) or exclamation emoji (❗) for manual processing
    if (reaction.emoji.name !== '⚡' && reaction.emoji.name !== '❗') return;
    
    // Fetch the full message if it's partial
    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
    
    // Route to appropriate handler based on channel
    if (reaction.message.channelId === FA_CHANNEL_ID) {
      console.log(`[Discord Bot] ${reaction.emoji.name} reaction detected in FA channel by ${user.tag}`);
      
      // Handle ❗ emoji - manually record a single bid (authorized user only)
      if (reaction.emoji.name === '❗') {
        // Check if user is authorized
        if (user.id !== '679275787664359435') {
          console.log(`[Discord Bot] Unauthorized user ${user.tag} (${user.id}) attempted manual processing`);
          return;
        }
        
        console.log('[Discord Bot] Authorized user triggered manual bid recording');
        const { parseBidMessage, findPlayerByFuzzyName, recordBid, getCurrentBiddingWindow } = await import('./fa-bid-parser');
        const { getDb } = await import('./db');
        const { players: playersTable, teamAssignments } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        try {
          // Parse the bid
          const parsedBid = parseBidMessage(message.content);
          if (!parsedBid) {
            await message.reply('❌ Could not parse bid from message.');
            return;
          }
          
          // Get team from message author's Discord ID
          const db = await getDb();
          if (!db) {
            await message.reply('❌ Database connection failed.');
            return;
          }
          
          const teamAssignment = await db.select().from(teamAssignments).where(eq(teamAssignments.discordUserId, message.author.id));
          if (!teamAssignment || teamAssignment.length === 0) {
            await message.reply('❌ Message author has no team assignment.');
            return;
          }
          
          const team = teamAssignment[0].team;
          
          // Validate players
          const signPlayer = await findPlayerByFuzzyName(parsedBid.playerName, undefined, true);
          if (!signPlayer) {
            await message.reply(`❌ Could not find player to sign: ${parsedBid.playerName}`);
            return;
          }
          
          let dropPlayer = null;
          if (parsedBid.dropPlayer) {
            dropPlayer = await findPlayerByFuzzyName(parsedBid.dropPlayer, team, false);
            if (!dropPlayer) {
              await message.reply(`❌ Could not find player to drop: ${parsedBid.dropPlayer}`);
              return;
            }
          }
          
          // Get current window
          const window = getCurrentBiddingWindow();
          
          // Record the bid
          await recordBid(
            signPlayer.name,
            signPlayer.id,
            message.author.id,
            message.author.username || message.author.tag,
            team,
            parsedBid.bidAmount,
            window.windowId,
            message.id,
            dropPlayer?.name
          );
          
          await message.reply(
            `✅ **Manual Bid Recorded**\n\n` +
            `**Team:** ${team}\n` +
            `**Sign:** ${signPlayer.name} (${signPlayer.overall} OVR)\n` +
            (dropPlayer ? `**Drop:** ${dropPlayer.name} (${dropPlayer.overall} OVR)\n` : '') +
            `**Bid:** $${parsedBid.bidAmount}`
          );
        } catch (error) {
          console.error('[Discord Bot] Manual bid processing failed:', error);
          await message.reply('❌ Manual bid processing failed. Check logs for details.');
        }
        return;
      }
      
      // Check if this is a window close summary message (from bot with "Bidding Window Closed" title)
      if (message.author.bot && message.embeds.length > 0 && message.embeds[0].title?.includes('Bidding Window Closed')) {
        console.log('[Discord Bot] Detected window close summary, showing preview...');
        const { generateBatchPreview } = await import('./fa-window-close');
        const { EmbedBuilder } = await import('discord.js');
        
        // Generate preview
        const preview = await generateBatchPreview(message);
        
        if (!preview.success) {
          // Show validation errors
          const errorList = preview.errors?.join('\n') || 'Unknown error';
          const warningList = preview.warnings?.join('\n') || '';
          
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Validation Failed')
            .setDescription(`Cannot process batch: ${preview.message}`);
          
          if (errorList) {
            embed.addFields({ name: 'Errors', value: errorList.substring(0, 1024) });
          }
          
          if (warningList) {
            embed.addFields({ name: 'Warnings', value: warningList.substring(0, 1024) });
          }
          
          await message.reply({ embeds: [embed] });
          return;
        }
        
        // Show preview with confirmation
        const previewEmbed = new EmbedBuilder()
          .setColor(0xffaa00)
          .setTitle('⚠️ Batch Processing Preview')
          .setDescription(`**${preview.bidCount} transactions ready to process**\n\nReact with ✅ within 30 seconds to confirm and execute.`);
        
        if (preview.teamSummaries && preview.teamSummaries.length > 0) {
          const summaryList = preview.teamSummaries.slice(0, 20).join('\n');
          const remaining = preview.teamSummaries.length - 20;
          previewEmbed.addFields({ 
            name: `Transactions by Team (${preview.teamSummaries.length} teams)`, 
            value: summaryList + (remaining > 0 ? `\n... and ${remaining} more teams` : ''),
            inline: false
          });
        }
        
        previewEmbed.setFooter({ text: `Total coins: $${preview.totalCoins} | Requested by ${user.tag}` });
        
        const previewMessage = await message.reply({ embeds: [previewEmbed] });
        await previewMessage.react('✅');
        
        // Wait for confirmation
        const filter = (r: any, u: any) => r.emoji.name === '✅' && u.id === user.id;
        const collector = previewMessage.createReactionCollector({ filter, time: 30000, max: 1 });
        
        collector.on('collect', async () => {
          console.log('[Discord Bot] Batch processing confirmed, executing...');
          await previewMessage.edit({ embeds: [previewEmbed.setDescription('🔄 Processing transactions...')] });
          
          const { processBidsFromSummary } = await import('./fa-window-close');
          const result = await processBidsFromSummary(message, user.tag || user.username || 'Unknown');
          
          if (result.success && 'results' in result && result.results) {
            const successList = result.results
              .filter(r => r.success)
              .map(r => `✅ ${r.playerName} → **${r.team}** ($${r.bidAmount})`)
              .join('\n') || 'None';
            
            const failList = result.results
              .filter(r => !r.success)
              .map(r => `❌ ${r.playerName} → **${r.team}** - ${r.error || 'Unknown error'}`)
              .join('\n') || 'None';
            
            const totalCoins = result.results
              .filter(r => r.success)
              .reduce((sum, r) => sum + r.bidAmount, 0);
            
            const embed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle('✅ Batch Processing Complete')
              .setDescription(`Processed ${result.successCount} successful transactions`);
            
            if (successList !== 'None') {
              embed.addFields({ name: 'Successful Transactions', value: successList.substring(0, 1024) });
            }
            
            if (failList !== 'None') {
              embed.addFields({ name: 'Failed Transactions', value: failList.substring(0, 1024) });
            }
            
            embed.setFooter({ text: `Total coins spent: $${totalCoins} | Processed by ${user.tag}` });
            
            const completionMessage = await previewMessage.edit({ embeds: [embed] });
            
            // Add retry button if there are failures
            if (result.failCount && result.failCount > 0) {
              await completionMessage.react('🔄');
              
              // Set up retry collector
              const retryCollector = completionMessage.createReactionCollector({
                filter: (r, u) => r.emoji.name === '🔄' && !u.bot,
                time: 300000, // 5 minutes
                max: 1
              });
              
              retryCollector.on('collect', async (r, retryUser) => {
                console.log(`[Discord Bot] Retry requested by ${retryUser.tag}`);
                
                // Extract failed transactions
                const failedBids = result.results
                  .filter(res => !res.success)
                  .map(res => ({
                    playerName: res.playerName,
                    team: res.team,
                    bidAmount: res.bidAmount,
                    dropPlayer: res.dropPlayer,
                    bidderName: retryUser.username
                  }));
                
                if (failedBids.length === 0) {
                  await completionMessage.reply('No failed transactions to retry.');
                  return;
                }
                
                // Create a mock message object with failed bids as embed
                const { EmbedBuilder: EmbedBuilder2 } = await import('discord.js');
                const retryEmbed = new EmbedBuilder2()
                  .setTitle('🔄 Retry Failed Transactions')
                  .setDescription(`Retrying ${failedBids.length} failed transaction${failedBids.length === 1 ? '' : 's'}`);
                
                // Group by team for display
                const teamGroups = new Map<string, typeof failedBids>();
                for (const bid of failedBids) {
                  if (!teamGroups.has(bid.team)) {
                    teamGroups.set(bid.team, []);
                  }
                  teamGroups.get(bid.team)!.push(bid);
                }
                
                const sortedTeams = Array.from(teamGroups.keys()).sort();
                for (const team of sortedTeams) {
                  const bids = teamGroups.get(team)!;
                  const teamCoins = bids.reduce((sum, b) => sum + b.bidAmount, 0);
                  const details = bids.map(b => {
                    if (b.dropPlayer) {
                      return `Cut: ${b.dropPlayer} / Sign: ${b.playerName} - $${b.bidAmount}`;
                    } else {
                      return `Sign: ${b.playerName} - $${b.bidAmount}`;
                    }
                  }).join('\n');
                  
                  retryEmbed.addFields({
                    name: `${team} ($${teamCoins})`,
                    value: details,
                    inline: false
                  });
                }
                
                const mockMessage = {
                  embeds: [retryEmbed]
                };
                
                // Generate preview for retry
                const { generateBatchPreview } = await import('./fa-window-close');
                const retryPreview = await generateBatchPreview(mockMessage);
                
                if (!retryPreview.success) {
                  await completionMessage.reply(`❌ Failed to generate retry preview: ${retryPreview.message}`);
                  return;
                }
                
                // Post retry preview
                const retryPreviewEmbed = new EmbedBuilder2()
                  .setColor(0xffaa00)
                  .setTitle('⚠️ Retry Batch Processing Preview')
                  .setDescription(`**${retryPreview.bidCount} failed transactions ready to retry**\n\nReact with ✅ within 30 seconds to confirm and execute.`);
                
                if (retryPreview.teamSummaries && retryPreview.teamSummaries.length > 0) {
                  const summaryList = retryPreview.teamSummaries.slice(0, 20).join('\n');
                  const remaining = retryPreview.teamSummaries.length - 20;
                  retryPreviewEmbed.addFields({ 
                    name: `Transactions by Team (${retryPreview.teamSummaries.length} teams)`, 
                    value: summaryList + (remaining > 0 ? `\n... and ${remaining} more teams` : ''),
                    inline: false
                  });
                }
                
                retryPreviewEmbed.setFooter({ text: `Total coins: $${retryPreview.totalCoins} | Requested by ${retryUser.tag}` });
                
                const retryPreviewMessage = await completionMessage.reply({ embeds: [retryPreviewEmbed] });
                await retryPreviewMessage.react('✅');
                
                // Set up confirmation collector for retry
                const retryConfirmCollector = retryPreviewMessage.createReactionCollector({
                  filter: (r, u) => r.emoji.name === '✅' && !u.bot,
                  time: 30000,
                  max: 1
                });
                
                retryConfirmCollector.on('collect', async (r, confirmUser) => {
                  console.log(`[Discord Bot] Retry confirmed by ${confirmUser.tag}`);
                  
                  // Process the retry batch
                  const { processBidsFromSummary } = await import('./fa-window-close');
                  const retryResult = await processBidsFromSummary(mockMessage, confirmUser.id);
                  
                  if (retryResult.success && retryResult.results) {
                    const retrySuccessList = retryResult.results
                      .filter(r => r.success)
                      .map(r => `✅ ${r.playerName} → **${r.team}** - $${r.bidAmount}`)
                      .join('\n') || 'None';
                    
                    const retryFailList = retryResult.results
                      .filter(r => !r.success)
                      .map(r => `❌ ${r.playerName} → **${r.team}** - ${r.error || 'Unknown error'}`)
                      .join('\n') || 'None';
                    
                    const retryTotalCoins = retryResult.results
                      .filter(r => r.success)
                      .reduce((sum, r) => sum + r.bidAmount, 0);
                    
                    const retryCompletionEmbed = new EmbedBuilder2()
                      .setColor(0x00ff00)
                      .setTitle('✅ Retry Complete')
                      .setDescription(`Processed ${retryResult.successCount} successful transactions`);
                    
                    if (retrySuccessList !== 'None') {
                      retryCompletionEmbed.addFields({ name: 'Successful Transactions', value: retrySuccessList.substring(0, 1024) });
                    }
                    
                    if (retryFailList !== 'None') {
                      retryCompletionEmbed.addFields({ name: 'Failed Transactions', value: retryFailList.substring(0, 1024) });
                    }
                    
                    retryCompletionEmbed.setFooter({ text: `Total coins spent: $${retryTotalCoins} | Processed by ${confirmUser.tag}` });
                    
                    await retryPreviewMessage.edit({ embeds: [retryCompletionEmbed] });
                    
                    // Add another retry button if there are still failures
                    if (retryResult.failCount && retryResult.failCount > 0) {
                      await retryPreviewMessage.react('🔄');
                    }
                  } else {
                    await retryPreviewMessage.edit({ content: `❌ Retry failed: ${retryResult.message}`, embeds: [] });
                  }
                });
                
                retryConfirmCollector.on('end', async (collected) => {
                  if (collected.size === 0) {
                    await retryPreviewMessage.edit({ 
                      embeds: [retryPreviewEmbed.setColor(0x808080).setDescription('⏱️ Confirmation timed out. Retry cancelled.')]
                    });
                  }
                });
              });
            }
          } else {
            await previewMessage.edit({ content: `❌ Batch processing failed: ${result.message}`, embeds: [] });
          }
        });
        
        collector.on('end', async (collected) => {
          if (collected.size === 0) {
            console.log('[Discord Bot] Batch processing timed out');
            await previewMessage.edit({ 
              embeds: [previewEmbed.setColor(0x808080).setDescription('⏱️ Confirmation timed out. Batch processing cancelled.')]
            });
          }
        });
        
        return;
      } else {
        // Manual single bid processing with ⚡ (authorized user only)
        if (user.id !== '679275787664359435') {
          console.log(`[Discord Bot] Unauthorized user ${user.tag} (${user.id}) attempted manual bid processing`);
          return;
        }
        
        console.log('[Discord Bot] Authorized user triggered manual bid processing (execute transaction)');
        const { parseBidMessage, findPlayerByFuzzyName } = await import('./fa-bid-parser');
        const { getDb } = await import('./db');
        const { players: playersTable, teamAssignments, teamCoins } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        try {
          // Parse the bid
          const parsedBid = parseBidMessage(message.content);
          if (!parsedBid) {
            await message.reply('❌ Could not parse bid from message.');
            return;
          }
          
          // Get team from message author's Discord ID
          const db = await getDb();
          if (!db) {
            await message.reply('❌ Database connection failed.');
            return;
          }
          
          const teamAssignment = await db.select().from(teamAssignments).where(eq(teamAssignments.discordUserId, message.author.id));
          if (!teamAssignment || teamAssignment.length === 0) {
            await message.reply('❌ Message author has no team assignment.');
            return;
          }
          
          let team = teamAssignment[0].team;
          
          // Validate players with interactive fix
          let signPlayer = await findPlayerByFuzzyName(parsedBid.playerName, undefined, true);
          let dropPlayer = null;
          
          if (parsedBid.dropPlayer) {
            dropPlayer = await findPlayerByFuzzyName(parsedBid.dropPlayer, team, false);
          }
          
          // If validation fails, ask for corrections
          if (!signPlayer || (parsedBid.dropPlayer && !dropPlayer)) {
            const errorMsg = !signPlayer 
              ? `❌ Could not find player to sign: ${parsedBid.playerName}`
              : `❌ Could not find player to drop: ${parsedBid.dropPlayer}`;
            
            const fixPrompt = await message.reply(
              `${errorMsg}\n\n` +
              `🛠️ **How should I fix this?**\n` +
              `Reply with corrections (e.g., \`sign: Johnny Furphy\` or \`team: Jazz\`)\n` +
              `Or reply \`cancel\` to abort.`
            );
            
            // Wait for user's correction
            const filter = (m: Message) => m.author.id === user.id;
            if (!('awaitMessages' in message.channel)) {
              await fixPrompt.reply('❌ Cannot await messages in this channel type.');
              return;
            }
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
            
            if (!collected.size) {
              await fixPrompt.reply('⏱️ Timeout - transaction cancelled.');
              return;
            }
            
            const correction = collected.first()!;
            if (correction.content.toLowerCase() === 'cancel') {
              await correction.reply('❌ Transaction cancelled.');
              return;
            }
            
            // Parse corrections
            const signMatch = correction.content.match(/sign:\s*(.+?)(?:\n|$)/i);
            const dropMatch = correction.content.match(/drop:\s*(.+?)(?:\n|$)/i);
            const teamMatch = correction.content.match(/team:\s*(.+?)(?:\n|$)/i);
            
            // Apply corrections
            if (signMatch) {
              signPlayer = await findPlayerByFuzzyName(signMatch[1].trim(), undefined, true);
              if (!signPlayer) {
                await correction.reply(`❌ Still could not find player: ${signMatch[1]}`);
                return;
              }
            }
            
            if (dropMatch) {
              dropPlayer = await findPlayerByFuzzyName(dropMatch[1].trim(), team, false);
              if (!dropPlayer) {
                await correction.reply(`❌ Still could not find player: ${dropMatch[1]}`);
                return;
              }
            }
            
            if (teamMatch) {
              const { validateTeamName } = await import('./team-validator');
              const correctedTeam = validateTeamName(teamMatch[1].trim());
              if (correctedTeam) {
                team = correctedTeam;
              }
            }
            
            // Re-validate after corrections
            if (!signPlayer) {
              await correction.reply('❌ Sign player still not found after corrections.');
              return;
            }
          }
          
          // Execute the roster transaction
          // 1. Drop player if specified
          if (dropPlayer) {
            await db.update(playersTable)
              .set({ team: 'Free Agents' })
              .where(eq(playersTable.id, dropPlayer.id));
          }
          
          // 2. Sign player
          await db.update(playersTable)
            .set({ team })
            .where(eq(playersTable.id, signPlayer.id));
          
          // 3. Deduct coins
          const { sql } = await import('drizzle-orm');
          await db.update(teamCoins)
            .set({ coinsRemaining: sql`coinsRemaining - ${parsedBid.bidAmount}` })
            .where(eq(teamCoins.team, team));
          
          await message.reply(
            `✅ **Transaction Processed**\n\n` +
            `**Team:** ${team}\n` +
            `**Signed:** ${signPlayer.name} (${signPlayer.overall} OVR)\n` +
            (dropPlayer ? `**Dropped:** ${dropPlayer.name} (${dropPlayer.overall} OVR)\n` : '') +
            `**Cost:** $${parsedBid.bidAmount}`
          );
        } catch (error) {
          console.error('[Discord Bot] Manual bid processing failed:', error);
          await message.reply('❌ Manual bid processing failed. Check logs for details.');
        }
      }
    } else if (reaction.message.channelId === TRADE_CHANNEL_ID) {
      console.log(`[Discord Bot] ⚡ reaction detected in Trade channel by ${user.tag}`);
      await handleTradeMessage(message);
    }
  });
  
  // Handle reaction removal for trade voting
  client.on('messageReactionRemove', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;
    
    // Handle trade voting (👍 👎)
    if (reaction.emoji.name === '👍' || reaction.emoji.name === '👎') {
      try {
        const { handleReactionRemove } = await import('./trade-voting');
        await handleReactionRemove(reaction, user);
      } catch (error) {
        console.error('[Trade Voting] Error handling reaction remove:', error);
      }
    }
  });
  
  await client.login(token);
}

/**
 * Stop Discord bot
 */
export async function stopDiscordBot() {
  if (client) {
    await client.destroy();
    client = null;
    console.log('[Discord Bot] Stopped');
  }
}

/**
 * Get Discord client instance
 */
export function getDiscordClient(): Client | null {
  return client;
}

/**
 * Get Discord bot status
 */
export function getDiscordBotStatus() {
  if (!client) {
    return {
      online: false,
      username: null,
      channelId: FA_CHANNEL_ID,
      guildId: GUILD_ID
    };
  }
  
  return {
    online: client.isReady(),
    username: client.user?.tag || null,
    channelId: FA_CHANNEL_ID,
    guildId: GUILD_ID
  };
}
