import { Client, GatewayIntentBits, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { getDb } from './db';
import { players, teamCoins, faTransactions } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { extract } from 'fuzzball';

const FA_CHANNEL_ID = '1267935048997539862';
const GUILD_ID = '860782751656837140';
const MIN_MESSAGE_ID = '1439020316058714263'; // Only process messages after this ID

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
 * Expected format: "Cut: Player A\nSign: Player B, OVR\nBid: X coins"
 */
function parseTransaction(message: string): ParsedTransaction | null {
  // Remove extra whitespace and normalize
  const text = message.trim();
  
  // Pattern: "Cut: X" and "Sign: Y, OVR" and optional "Bid: Z coins"
  const cutMatch = text.match(/cut:\s*(.+?)(?=\n|sign:|bid:|$)/i);
  const signMatch = text.match(/sign:\s*(.+?)(?:,\s*(\d+))?(?=\n|bid:|$)/i);
  const bidMatch = text.match(/bid:\s*(\d+)/i);
  
  if (cutMatch && signMatch) {
    const dropPlayer = cutMatch[1].trim();
    const signPlayer = signMatch[1].trim();
    const signPlayerOvr = signMatch[2] ? parseInt(signMatch[2]) : undefined;
    const bidAmount = bidMatch ? parseInt(bidMatch[1]) : 1; // Default to 1 if not specified
    
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
      
      // Deduct coins
      const newCoinsRemaining = teamCoinsData.coinsRemaining - bidAmount;
      await db
        .update(teamCoins)
        .set({ coinsRemaining: newCoinsRemaining })
        .where(eq(teamCoins.team, team));
      
      // Update both players
      await db
        .update(players)
        .set({ team: 'Free Agent' })
        .where(eq(players.id, droppedPlayer.id));
      
      await db
        .update(players)
        .set({ team: team })
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
  
  return { success, failed, details, coinSummary };
}

/**
 * Handle message in FA channel
 */
async function handleFAMessage(message: Message) {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only process messages after the specified threshold
  if (message.id <= MIN_MESSAGE_ID) {
    console.log(`[Discord Bot] Ignoring old message (ID: ${message.id})`);
    return;
  }
  
  // Parse the message
  const transaction = parseTransaction(message.content);
  if (!transaction) return;
  
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
      GatewayIntentBits.MessageContent
    ]
  });
  
  client.on('ready', () => {
    console.log(`[Discord Bot] Logged in as ${client?.user?.tag}`);
    console.log(`[Discord Bot] Monitoring FA channel: ${FA_CHANNEL_ID}`);
  });
  
  client.on('messageCreate', async (message) => {
    if (message.channelId === FA_CHANNEL_ID) {
      await handleFAMessage(message);
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
