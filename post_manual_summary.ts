import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import fs from 'fs';

const FA_CHANNEL_ID = '1095812920056762510';
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

async function postManualSummary() {
  // Read winning bids
  const bids = JSON.parse(fs.readFileSync('/home/ubuntu/final_winning_bids.json', 'utf-8'));
  
  // Create Discord client
  const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'MessageContent']
  });
  
  await client.login(DISCORD_TOKEN);
  
  console.log('Bot logged in');
  
  // Get FA channel
  const channel = await client.channels.fetch(FA_CHANNEL_ID) as TextChannel;
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('🏁 Bidding Window Closed: 2025-11-15-AM')
    .setDescription(`Winning Bids Summary\n\nThe following ${bids.length} players received bids this window:`);
  
  // Add fields for each winning bid
  for (const bid of bids) {
    embed.addFields({
      name: bid.player,
      value: `Cut: ${bid.cut} / Sign: ${bid.player} - $${bid.bid} - ${bid.team}`,
      inline: false
    });
  }
  
  const totalCoins = bids.reduce((sum: number, b: any) => sum + b.bid, 0);
  embed.setFooter({ text: `Total coins committed: $${totalCoins} | React with ⚡ to process bids` });
  
  // Post message
  const message = await channel.send({ embeds: [embed] });
  
  console.log(`Posted summary message: ${message.id}`);
  console.log(`Total bids: ${bids.length}, Total coins: $${totalCoins}`);
  
  await client.destroy();
  process.exit(0);
}

postManualSummary().catch(console.error);
