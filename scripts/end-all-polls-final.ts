import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const VOTING_CHANNEL_ID = '1464505967394816236';

// Poll message IDs in order: MVP, ROY, 6MOY, DPOY
const POLL_MESSAGE_IDS = [
  '1464737598046994483', // MVP
  '1464737645744619540', // ROY
  '1464737695426416762', // 6MOY
  '1464737745904861446', // DPOY
];

const VOTE_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

// Award names and trophy names
const AWARD_INFO: Record<string, { name: string; trophy: string }> = {
  'Most Valuable Player': {
    name: 'Most Valuable Player',
    trophy: 'The Michael Jordan Trophy',
  },
  'Defensive Player of the Year': {
    name: 'Defensive Player of the Year',
    trophy: 'The Hakeem Olajuwon Trophy',
  },
  'Rookie of the Year': {
    name: 'Rookie of the Year',
    trophy: 'The Wilt Chamberlain Trophy',
  },
  'Sixth Man of the Year': {
    name: 'Sixth Man of the Year',
    trophy: 'The John Havlicek Trophy',
  },
};

async function endPoll(channel: TextChannel, messageId: string) {
  try {
    const message = await channel.messages.fetch(messageId);
    const embed = message.embeds[0];
    
    if (!embed || !embed.title) {
      console.log(`No embed found for message ${messageId}`);
      return;
    }
    
    // Extract award type from title
    const titleMatch = embed.title.match(/🏆 (.+?)(?:\s+\(PREVIEW\))?$/);
    if (!titleMatch) {
      console.log(`Could not parse title: ${embed.title}`);
      return;
    }
    
    const awardType = titleMatch[1];
    const awardData = AWARD_INFO[awardType];
    
    if (!awardData) {
      console.log(`Unknown award type: ${awardType}`);
      return;
    }
    
    console.log(`\nProcessing ${awardType}...`);
    
    // Extract candidates from embed description
    const description = embed.description || '';
    const candidateMatches = description.matchAll(/[1-5]️⃣ \*\*(.+?)\*\* \((.+?)\)/g);
    const candidates: { name: string; team: string }[] = [];
    for (const match of candidateMatches) {
      candidates.push({ name: match[1], team: match[2] });
    }
    
    console.log(`Found ${candidates.length} candidates`);
    
    // Count votes from reactions
    const voteCounts: number[] = new Array(candidates.length).fill(0);
    let totalVotes = 0;
    
    for (let i = 0; i < candidates.length && i < VOTE_EMOJIS.length; i++) {
      const emoji = VOTE_EMOJIS[i];
      const reaction = message.reactions.cache.find(r => r.emoji.name === emoji);
      if (reaction) {
        // Subtract 1 for the bot's own reaction
        const voteCount = Math.max(0, reaction.count - 1);
        voteCounts[i] = voteCount;
        totalVotes += voteCount;
        console.log(`  ${emoji} ${candidates[i].name}: ${voteCount} votes`);
      }
    }
    
    // Find winner
    const maxVotes = Math.max(...voteCounts);
    const winnerIndex = voteCounts.indexOf(maxVotes);
    const winner = candidates[winnerIndex];
    
    console.log(`Winner: ${winner.name} with ${maxVotes} votes`);
    
    // Build results text
    let resultsText = '';
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const votes = voteCounts[i];
      const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
      const barLength = maxVotes > 0 ? Math.round((votes / maxVotes) * 10) : 0;
      const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
      const isWinner = i === winnerIndex ? '👑 ' : '';
      resultsText += `${isWinner}**${candidate.name}** (${candidate.team}): ${votes} votes (${percentage}%)\n${bar}\n\n`;
    }
    
    // Create results embed
    const resultsEmbed = new EmbedBuilder()
      .setTitle(`🏆 ${awardData.name} - RESULTS`)
      .setDescription(`**${awardData.trophy}**\n\n🎉 **Winner: ${winner.name}** 🎉\n\n${resultsText}`)
      .setColor(0x00FF00)
      .addFields({ name: '📊 Total Votes', value: totalVotes.toString(), inline: true })
      .setFooter({ text: 'Voting has ended' })
      .setTimestamp();
    
    // Post results
    await channel.send({ embeds: [resultsEmbed] });
    
    // Update original message
    const updatedEmbed = EmbedBuilder.from(embed)
      .setFooter({ text: '🔒 Voting has ended - See results below' })
      .setColor(0x808080);
    await message.edit({ embeds: [updatedEmbed] });
    
    console.log(`✅ Results posted for ${awardType}`);
    
  } catch (error) {
    console.error(`Error processing poll ${messageId}:`, error);
  }
}

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
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });
  
  client.once('ready', async () => {
    console.log(`✅ Connected as ${client.user?.tag}\n`);
    
    try {
      const channel = await client.channels.fetch(VOTING_CHANNEL_ID) as TextChannel;
      console.log(`Found channel: #${channel.name}\n`);
      
      // Process each poll
      for (const messageId of POLL_MESSAGE_IDS) {
        await endPoll(channel, messageId);
        // Wait between posts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('\n✅ All award polls ended and results posted!');
      process.exit(0);
      
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });
  
  client.login(DISCORD_BOT_TOKEN);
}

main();
