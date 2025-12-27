import { Client, GatewayIntentBits, Partials } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel]
});

client.once('clientReady', async () => {
  try {
    const channel = await client.channels.fetch('1087524540634116116');
    const message = await channel.messages.fetch('1449555431881048136');
    console.log('=== EMBED DATA ===');
    console.log(JSON.stringify(message.embeds[0].data, null, 2));
    await client.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await client.destroy();
    process.exit(1);
  }
});

await client.login(process.env.DISCORD_BOT_TOKEN);
