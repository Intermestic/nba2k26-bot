/**
 * Test script to manually post welcome message to Grizzlies team chat
 */

import { Client, GatewayIntentBits } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = '860782751656837140';
const TEST_USER_ID = '123456789'; // Placeholder - will use any Grizzlies member

if (!DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN not found in environment');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', async () => {
  console.log('✅ Bot connected as', client.user.tag);
  
  try {
    // Import the welcome message function
    const { postWelcomeMessage } = await import('./server/team-welcome-message');
    
    // Get guild
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log('✅ Guild found:', guild.name);
    
    // Find Grizzlies channel
    const grizzliesChannel = guild.channels.cache.find(
      c => c.name === 'team-grizzlies'
    );
    
    if (!grizzliesChannel) {
      console.error('❌ Grizzlies channel not found');
      process.exit(1);
    }
    
    console.log('✅ Found channel:', grizzliesChannel.name);
    
    // Find a Grizzlies member (look for someone with Grizzlies role)
    const grizzliesRole = guild.roles.cache.find(r => r.name === 'Grizzlies');
    
    if (!grizzliesRole) {
      console.error('❌ Grizzlies role not found');
      process.exit(1);
    }
    
    console.log('✅ Found Grizzlies role');
    
    // Get a member with the Grizzlies role
    const members = await guild.members.fetch();
    const grizzliesMember = members.find(m => m.roles.cache.has(grizzliesRole.id));
    
    if (!grizzliesMember) {
      console.log('⚠️ No Grizzlies members found, using test user ID');
      await postWelcomeMessage(client, 'Grizzlies', TEST_USER_ID, 'TestUser');
    } else {
      console.log('✅ Found Grizzlies member:', grizzliesMember.user.username);
      await postWelcomeMessage(
        client,
        'Grizzlies',
        grizzliesMember.id,
        grizzliesMember.user.username
      );
    }
    
    console.log('✅ Welcome message posted to #team-grizzlies');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});

client.login(DISCORD_BOT_TOKEN);

// Timeout after 30 seconds
setTimeout(() => {
  console.error('❌ Timeout - exiting');
  process.exit(1);
}, 30000);
