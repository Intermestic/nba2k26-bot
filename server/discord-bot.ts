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
  
  // Calculate total cap
  const totalCap = teamPlayers.reduce((sum, p) => sum + (p.salaryCap || 0), 0);
  
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
  
  // Find player by fuzzy matching
  const player = await findPlayerByFuzzyName(parsedBid.playerName);
  
  if (!player) {
    console.log(`[FA Bids] Player not found: ${parsedBid.playerName}`);
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
  
  // Determine team from drop player or message context
  let team = 'Unknown';
  if (parsedBid.dropPlayer) {
    const droppedPlayer = await findPlayerByName(parsedBid.dropPlayer);
    if (droppedPlayer) {
      team = droppedPlayer.team || 'Unknown';
    }
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
    message.id
  );
  
  if (!bidResult.success) {
    console.error(`[FA Bids] Failed to record bid`);
    return;
  }
  
  console.log(`[FA Bids] ✅ Bid recorded: ${message.author.username} (${team}) bid $${parsedBid.bidAmount} on ${player.name}`);
  
  // Get all bids for this player to show current status
  const { getActiveBids } = await import('./fa-bid-parser');
  const activeBids = await getActiveBids(window.windowId);
  const playerBids = activeBids.filter(b => b.playerName === player.name);
  const highestBid = playerBids.length > 0 ? playerBids[0] : null;
  
  // Send confirmation message
  let confirmationMessage = `✅ **Bid Confirmed**\n\n`;
  confirmationMessage += `**Player**: ${player.name} (${player.overall} OVR)\n`;
  confirmationMessage += `**Your bid**: $${parsedBid.bidAmount}\n`;
  confirmationMessage += `**Team**: ${team}\n\n`;
  
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
  });
  
  // Monitor all messages for FA bids and commands
  client.on('messageCreate', async (message) => {
    if (message.channelId === FA_CHANNEL_ID) {
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
      
      await handleBidMessage(message);
    }
  });
  
  // Handle emoji reactions for manual transaction and trade processing
  client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;
    
    // Only process lightning bolt emoji
    if (reaction.emoji.name !== '⚡') return;
    
    // Fetch the full message if it's partial
    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
    
    // Route to appropriate handler based on channel
    if (reaction.message.channelId === FA_CHANNEL_ID) {
      console.log(`[Discord Bot] ⚡ reaction detected in FA channel by ${user.tag}`);
      await handleFAMessage(message);
    } else if (reaction.message.channelId === TRADE_CHANNEL_ID) {
      console.log(`[Discord Bot] ⚡ reaction detected in Trade channel by ${user.tag}`);
      await handleTradeMessage(message);
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
