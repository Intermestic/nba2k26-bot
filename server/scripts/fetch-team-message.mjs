import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const MESSAGE_ID = '1130885281508233316';
const CHANNEL_ID = '860782989280935966';

async function fetchMessage() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('Bot logged in successfully');

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error('Channel not found or not text-based');
      return;
    }

    const message = await channel.messages.fetch(MESSAGE_ID);
    
    console.log('\n=== MESSAGE CONTENT ===');
    console.log('Author:', message.author.tag);
    console.log('Created:', message.createdAt);
    console.log('\nContent:');
    console.log(message.content);
    
    if (message.embeds.length > 0) {
      console.log('\n=== EMBEDS ===');
      message.embeds.forEach((embed, i) => {
        console.log(`\nEmbed ${i + 1}:`);
        console.log('Title:', embed.title);
        console.log('Description:', embed.description);
        if (embed.fields.length > 0) {
          console.log('Fields:');
          embed.fields.forEach(field => {
            console.log(`  ${field.name}: ${field.value}`);
          });
        }
      });
    }

    await client.destroy();
  } catch (error) {
    console.error('Error fetching message:', error);
    process.exit(1);
  }
}

fetchMessage();
