import { Client, GatewayIntentBits, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { getDb } from './db';
import { players } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { extract } from 'fuzzball';

const FA_CHANNEL_ID = '1267935048997539862';
const GUILD_ID = '860782751656837140';

interface ParsedTransaction {
  dropPlayer: string;
  signPlayer: string;
  detectedTeam?: string;
}

let client: Client | null = null;
let pendingTransactions: ParsedTransaction[] = [];

/**
 * Parse FA transaction message
 * Expected format: "Cut Player A. Sign Player B"
 */
function parseTransaction(message: string): ParsedTransaction | null {
  // Remove extra whitespace and normalize
  const text = message.trim();
  
  // Pattern: "Cut X. Sign Y" or "Drop X. Add Y"
  const cutSign = text.match(/(?:cut|drop)\s+(.+?)\.\s*(?:sign|add)\s+(.+?)(?:\.|$)/i);
  if (cutSign) {
    return {
      dropPlayer: cutSign[1].trim(),
      signPlayer: cutSign[2].trim()
    };
  }
  
  return null;
}

/**
 * Find player by fuzzy name matching
 */
async function findPlayerByName(name: string): Promise<{ id: string; name: string; team: string } | null> {
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
        team: player.team
      };
    }
  }
  
  return null;
}

/**
 * Process approved transactions with roster-based team detection
 */
async function processTransactions(transactions: ParsedTransaction[]): Promise<{ success: number; failed: number; details: string[] }> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  let success = 0;
  let failed = 0;
  const details: string[] = [];
  
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
      
      // Update both players
      // Remove dropped player from team (set to "Free Agent" or delete)
      await db
        .update(players)
        .set({ team: 'Free Agent' })
        .where(eq(players.id, droppedPlayer.id));
      
      // Add signed player to team
      await db
        .update(players)
        .set({ team: team })
        .where(eq(players.id, signedPlayer.id));
      
      success++;
      details.push(`✅ ${team}: Dropped ${droppedPlayer.name}, Signed ${signedPlayer.name}`);
      console.log(`[Discord Bot] ${team}: Dropped ${droppedPlayer.name}, Signed ${signedPlayer.name}`);
    } catch (error) {
      failed++;
      details.push(`❌ Error processing transaction`);
      console.error(`[Discord Bot] Failed to process transaction:`, error);
    }
  }
  
  return { success, failed, details };
}

/**
 * Handle message in FA channel
 */
async function handleFAMessage(message: Message) {
  // Ignore bot messages
  if (message.author.bot) return;
  
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
    
    // Create confirmation message with detected teams
    const transactionList = transactionsToProcess
      .map((t, i) => {
        const teamInfo = t.detectedTeam ? `[${t.detectedTeam}]` : '[Team Unknown]';
        return `${i + 1}. ${teamInfo} Drop: ${t.dropPlayer}, Sign: ${t.signPlayer}`;
      })
      .join('\n');
    
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
      content: `🤖 **FA Transaction Confirmation**\n\nDetected ${transactionsToProcess.length} transaction(s):\n\`\`\`\n${transactionList}\n\`\`\`\nShould I process these transactions?`,
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
        
        const result = await processTransactions(transactionsToProcess);
        
        const detailsText = result.details.join('\n');
        await interaction.editReply({
          content: `✅ **Transactions Processed**\n\n${detailsText}\n\n**Summary:** ✅ ${result.success} successful, ❌ ${result.failed} failed`
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
