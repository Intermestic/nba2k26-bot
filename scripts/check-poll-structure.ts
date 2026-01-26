import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const VOTING_CHANNEL_ID = '1464505967394816236';
const FIRST_POLL_MESSAGE_ID = '1464737995998367797';

async function main() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });
  
  client.once('ready', async () => {
    console.log(`Connected as ${client.user?.tag}\n`);
    
    const channel = await client.channels.fetch(VOTING_CHANNEL_ID) as TextChannel;
    const message = await channel.messages.fetch(FIRST_POLL_MESSAGE_ID);
    
    console.log('Message content:', message.content);
    console.log('\nEmbeds:', message.embeds.length);
    
    if (message.embeds.length > 0) {
      const embed = message.embeds[0];
      console.log('\nEmbed data:');
      console.log('Title:', embed.title);
      console.log('Description:', embed.description);
      console.log('Fields:', embed.fields);
    }
    
    console.log('\nReactions:');
    message.reactions.cache.forEach(reaction => {
      console.log(`${reaction.emoji.name}: ${reaction.count} reactions`);
    });
    
    process.exit(0);
  });
  
  client.login(DISCORD_BOT_TOKEN);
}

main();
