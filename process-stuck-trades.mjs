import { Client, GatewayIntentBits, Partials } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TRADE_MESSAGE_IDS = [
  '1449555431881048136',
  '1449555517377613844',
  '1449555550357557272'
];

async function processStuckTrades() {
  console.log('[Process Stuck Trades] Starting...');
  
  if (!DISCORD_BOT_TOKEN) {
    console.error('[Process Stuck Trades] DISCORD_BOT_TOKEN not found in environment');
    process.exit(1);
  }
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction
    ]
  });
  
  client.once('ready', async () => {
    console.log(`[Process Stuck Trades] Logged in as ${client.user.tag}`);
    
    try {
      // Import the manual check function
      const { manuallyCheckTradeVotes } = await import('./server/trade-voting.ts');
      
      for (const messageId of TRADE_MESSAGE_IDS) {
        console.log(`\n[Process Stuck Trades] Processing trade ${messageId}...`);
        
        try {
          const result = await manuallyCheckTradeVotes(client, messageId);
          
          if (result.success) {
            console.log(`[Process Stuck Trades] ✅ ${result.message}`);
          } else {
            console.log(`[Process Stuck Trades] ⚠️  ${result.message}`);
          }
        } catch (error) {
          console.error(`[Process Stuck Trades] ❌ Error processing trade ${messageId}:`, error);
        }
        
        // Wait 2 seconds between trades to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('\n[Process Stuck Trades] All trades processed. Exiting...');
      await client.destroy();
      process.exit(0);
      
    } catch (error) {
      console.error('[Process Stuck Trades] Fatal error:', error);
      await client.destroy();
      process.exit(1);
    }
  });
  
  await client.login(DISCORD_BOT_TOKEN);
}

processStuckTrades();
