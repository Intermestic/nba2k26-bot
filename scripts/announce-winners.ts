import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const VOTING_CHANNEL_ID = '1464505967394816236';

async function main() {
  if (!DISCORD_BOT_TOKEN) {
    console.error('DISCORD_BOT_TOKEN not set');
    process.exit(1);
  }
  
  console.log('Connecting to Discord...');
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
  
  client.once('ready', async () => {
    console.log(`✅ Connected as ${client.user?.tag}\n`);
    
    try {
      const channel = await client.channels.fetch(VOTING_CHANNEL_ID) as TextChannel;
      console.log(`Found channel: #${channel.name}\n`);
      
      // Create announcement embed
      const embed = new EmbedBuilder()
        .setTitle('🏆 SZN 17 AWARD WINNERS 🏆')
        .setDescription(
          '**Congratulations to the SZN 17 Award Winners!**\n\n' +
          'After 8 hours of voting, the league has spoken. Here are your award winners:\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '**🏀 Most Valuable Player**\n' +
          '**The Michael Jordan Trophy**\n' +
          '👑 **Brandon Ingram** (Pistons)\n' +
          '_38.80 PPG | FG 60.7% | 3P 50.4% | FT 90.9%_\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '**🛡️ Defensive Player of the Year**\n' +
          '**The Hakeem Olajuwon Trophy**\n' +
          '👑 **Jalen Suggs** (Wizards)\n' +
          '_DIS 88.00 | OppFG 43.97% | 2.07 SPG_\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '**🌟 Rookie of the Year**\n' +
          '**The Wilt Chamberlain Trophy**\n' +
          '👑 **Jamir Watkins** (Pistons)\n' +
          '_13.69 PPG | 2.73 APG | +/- 502_\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '**⚡ Sixth Man of the Year**\n' +
          '**The John Havlicek Trophy**\n' +
          '👑 **Kentavious Caldwell-Pope** (Nuggets)\n' +
          '_17.23 PPG | FG 58.0% | 3P 52.8%_\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '**Special thanks to all 19 voters who participated!**\n' +
          '_18 voters completed all 4 polls and are eligible for voting rewards._'
        )
        .setColor(0xFFD700) // Gold
        .setFooter({ text: 'Hall of Fame Basketball Association • SZN 17' })
        .setTimestamp();
      
      // Post announcement with @everyone
      await channel.send({
        content: '@everyone',
        embeds: [embed],
      });
      
      console.log('✅ Award winners announcement posted!');
      process.exit(0);
      
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });
  
  client.login(DISCORD_BOT_TOKEN);
}

main();
