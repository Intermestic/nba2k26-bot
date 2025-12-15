import { Client, GatewayIntentBits, Partials } from 'discord.js';

const TRADE_IDS = [
  '1449555431881048136',
  '1449555517377613844',
  '1449555550357557272'
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel]
});

client.once('clientReady', async () => {
  try {
    const channel = await client.channels.fetch('1087524540634116116');
    
    for (const tradeId of TRADE_IDS) {
      console.log(`\n=== TRADE ${tradeId} ===`);
      const message = await channel.messages.fetch(tradeId);
      if (message.embeds[0]) {
        console.log('Description:');
        console.log(message.embeds[0].description);
        console.log('---');
      }
    }
    
    await client.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await client.destroy();
    process.exit(1);
  }
});

await client.login(process.env.DISCORD_BOT_TOKEN);
