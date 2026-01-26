/**
 * Manually trigger award poll results
 * This script will end all active award polls and post results
 */

import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const VOTING_CHANNEL_ID = '1464505967394816236';

// The message ID where the first poll started
const FIRST_POLL_MESSAGE_ID = '1464737995998367797';

// Award types in order
const AWARD_TYPES = ['MVP', 'DPOY', 'ROY', '6MOY'];

// Emoji reactions for voting
const VOTE_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

// Award full names
const AWARD_NAMES: Record<string, string> = {
  MVP: 'Most Valuable Player',
  DPOY: 'Defensive Player of the Year',
  ROY: 'Rookie of the Year',
  '6MOY': 'Sixth Man of the Year',
};

// Trophy names
const TROPHY_NAMES: Record<string, string> = {
  MVP: 'The Michael Jordan Trophy',
  DPOY: 'The Hakeem Olajuwon Trophy',
  ROY: 'The Wilt Chamberlain Trophy',
  '6MOY': 'The John Havlicek Trophy',
};

async function endPoll(channel: TextChannel, messageId: string, awardType: string) {
  try {
    console.log(`\nProcessing ${awardType} poll (${messageId})...`);
    
    const message = await channel.messages.fetch(messageId);
    
    // Get the original embed to extract candidate names
    const originalEmbed = message.embeds[0];
    if (!originalEmbed) {
      console.log(`No embed found for ${awardType}`);
      return;
    }
    
    // Extract candidates from embed description
    const description = originalEmbed.description || '';
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
    
    // Build results embed
    let resultsText = '';
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const votes = voteCounts[i];
      const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
      const barLength = Math.round((votes / Math.max(maxVotes, 1)) * 10);
      const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
      const isWinner = i === winnerIndex ? '👑 ' : '';
      resultsText += `${isWinner}**${candidate.name}**: ${votes} votes (${percentage}%)\n${bar}\n\n`;
    }
    
    const resultsEmbed = new EmbedBuilder()
      .setTitle(`🏆 ${AWARD_NAMES[awardType]} - RESULTS`)
      .setDescription(`**${TROPHY_NAMES[awardType]}**\n\n🎉 **Winner: ${winner.name}** 🎉\n\n${resultsText}`)
      .setColor(0x00FF00)
      .addFields({ name: '📊 Total Votes', value: totalVotes.toString(), inline: true })
      .setFooter({ text: 'Voting has ended' })
      .setTimestamp();
    
    // Post results
    await channel.send({ embeds: [resultsEmbed] });
    
    // Update original message to show voting ended
    const updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setFooter({ text: '🔒 Voting has ended - See results below' })
      .setColor(0x808080);
    await message.edit({ embeds: [updatedEmbed] });
    
    console.log(`✅ Results posted for ${awardType}`);
    
  } catch (error) {
    console.error(`Error processing ${awardType}:`, error);
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
      
      // Fetch all messages after the first poll to find all 4 polls
      const messages = await channel.messages.fetch({ after: FIRST_POLL_MESSAGE_ID, limit: 10 });
      const pollMessages = [FIRST_POLL_MESSAGE_ID, ...messages.map(m => m.id)].slice(0, 4);
      
      console.log(`Found ${pollMessages.length} poll messages\n`);
      
      // Process each poll
      for (let i = 0; i < pollMessages.length && i < AWARD_TYPES.length; i++) {
        await endPoll(channel, pollMessages[i], AWARD_TYPES[i]);
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
