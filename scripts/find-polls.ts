import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const VOTING_CHANNEL_ID = '1464505967394816236';

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
    
    // Fetch recent messages
    const messages = await channel.messages.fetch({ limit: 20 });
    
    console.log(`Fetched ${messages.size} messages\n`);
    
    // Find messages with embeds (polls)
    const pollMessages = messages.filter(m => 
      m.embeds.length > 0 && 
      (m.embeds[0].title?.includes('of the Year') || m.embeds[0].title?.includes('Most Valuable Player'))
    );
    
    console.log(`Found ${pollMessages.size} poll messages:\n`);
    
    pollMessages.forEach(msg => {
      const embed = msg.embeds[0];
      console.log(`Message ID: ${msg.id}`);
      console.log(`Title: ${embed.title}`);
      console.log(`Reactions:`, msg.reactions.cache.map(r => `${r.emoji.name}:${r.count}`).join(', '));
      console.log('---\n');
    });
    
    process.exit(0);
  });
  
  client.login(DISCORD_BOT_TOKEN);
}

main();
