import { Client, GatewayIntentBits, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { getDb } from './db';
import { players } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const FA_CHANNEL_ID = '1267935048997539862';
const GUILD_ID = '860782751656837140';

interface ParsedTransaction {
  playerName: string;
  team: string;
}

let client: Client | null = null;
let pendingTransactions: ParsedTransaction[] = [];

/**
 * Parse FA transaction message
 * Expected formats:
 * - "Player Name signs with Team"
 * - "Player Name to Team"
 * - "Team signs Player Name"
 */
function parseTransaction(message: string): ParsedTransaction | null {
  // Remove extra whitespace and normalize
  const text = message.trim();
  
  // Pattern 1: "Player signs with Team"
  const signsWith = text.match(/^(.+?)\s+signs?\s+with\s+(.+)$/i);
  if (signsWith) {
    return {
      playerName: signsWith[1].trim(),
      team: signsWith[2].trim()
    };
  }
  
  // Pattern 2: "Player to Team"
  const toTeam = text.match(/^(.+?)\s+to\s+(.+)$/i);
  if (toTeam) {
    return {
      playerName: toTeam[1].trim(),
      team: toTeam[2].trim()
    };
  }
  
  // Pattern 3: "Team signs Player"
  const teamSigns = text.match(/^(.+?)\s+signs?\s+(.+)$/i);
  if (teamSigns) {
    return {
      playerName: teamSigns[2].trim(),
      team: teamSigns[1].trim()
    };
  }
  
  return null;
}

/**
 * Normalize team name to match database
 */
function normalizeTeamName(team: string): string {
  const teamMap: Record<string, string> = {
    'lakers': 'Lakers',
    'warriors': 'Warriors',
    'celtics': 'Celtics',
    'heat': 'Heat',
    'nets': 'Nets',
    'blazers': 'Trail Blazers',
    'trail blazers': 'Trail Blazers',
    'trailblazers': 'Trail Blazers',
    // Add more mappings as needed
  };
  
  const normalized = team.toLowerCase().trim();
  return teamMap[normalized] || team;
}

/**
 * Process approved transactions
 */
async function processTransactions(transactions: ParsedTransaction[]): Promise<{ success: number; failed: number }> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  let success = 0;
  let failed = 0;
  
  for (const transaction of transactions) {
    try {
      const normalizedTeam = normalizeTeamName(transaction.team);
      
      // Find player by name (case-insensitive)
      const playerList = await db
        .select()
        .from(players)
        .where(eq(players.name, transaction.playerName));
      
      if (playerList.length > 0) {
        // Update player team
        await db
          .update(players)
          .set({ team: normalizedTeam })
          .where(eq(players.id, playerList[0].id));
        
        success++;
        console.log(`[Discord Bot] Updated ${transaction.playerName} to ${normalizedTeam}`);
      } else {
        failed++;
        console.log(`[Discord Bot] Player not found: ${transaction.playerName}`);
      }
    } catch (error) {
      failed++;
      console.error(`[Discord Bot] Failed to process transaction:`, error);
    }
  }
  
  return { success, failed };
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
  
  // Add to pending transactions
  pendingTransactions.push(transaction);
  
  console.log(`[Discord Bot] Detected transaction: ${transaction.playerName} to ${transaction.team}`);
  
  // Send confirmation request after a short delay (batch multiple transactions)
  setTimeout(async () => {
    if (pendingTransactions.length === 0) return;
    
    const transactionsToProcess = [...pendingTransactions];
    pendingTransactions = [];
    
    // Create confirmation message
    const transactionList = transactionsToProcess
      .map((t, i) => `${i + 1}. ${t.playerName} → ${t.team}`)
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
        
        await interaction.editReply({
          content: `✅ **Transactions Processed**\n\n✅ Success: ${result.success}\n❌ Failed: ${result.failed}\n\nRosters have been updated automatically.`
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
