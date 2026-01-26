import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

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
      
      // Track which users voted in which polls
      const userVotes = new Map<string, Set<number>>();
      
      // Process each poll
      for (let pollIndex = 0; pollIndex < POLL_MESSAGE_IDS.length; pollIndex++) {
        const messageId = POLL_MESSAGE_IDS[pollIndex];
        const message = await channel.messages.fetch(messageId);
        const embed = message.embeds[0];
        const awardType = embed?.title?.replace('🏆 ', '') || `Poll ${pollIndex + 1}`;
        
        console.log(`Checking ${awardType}...`);
        
        // Check all vote emoji reactions
        for (const emoji of VOTE_EMOJIS) {
          const reaction = message.reactions.cache.find(r => r.emoji.name === emoji);
          if (reaction) {
            // Fetch all users who reacted
            const users = await reaction.users.fetch();
            users.forEach(user => {
              if (!user.bot) {
                if (!userVotes.has(user.id)) {
                  userVotes.set(user.id, new Set());
                }
                userVotes.get(user.id)!.add(pollIndex);
              }
            });
          }
        }
      }
      
      // Find users who voted in all 4 polls
      const completeVoters: Array<{ id: string; username: string; tag: string }> = [];
      
      for (const [userId, pollsVoted] of userVotes.entries()) {
        if (pollsVoted.size === 4) {
          try {
            const user = await client.users.fetch(userId);
            completeVoters.push({
              id: userId,
              username: user.username,
              tag: user.tag,
            });
          } catch (err) {
            console.error(`Could not fetch user ${userId}`);
          }
        }
      }
      
      console.log(`\n========== RESULTS ==========`);
      console.log(`Total unique voters: ${userVotes.size}`);
      console.log(`Users who voted in all 4 polls: ${completeVoters.length}\n`);
      
      if (completeVoters.length > 0) {
        console.log('Complete voters:');
        completeVoters.sort((a, b) => a.username.localeCompare(b.username));
        completeVoters.forEach((voter, index) => {
          console.log(`${index + 1}. ${voter.username} (${voter.tag}) - ID: ${voter.id}`);
        });
      }
      
      // Show breakdown of partial voters
      console.log('\n========== VOTING BREAKDOWN ==========');
      const voteCounts = new Map<number, number>();
      for (const pollsVoted of userVotes.values()) {
        const count = pollsVoted.size;
        voteCounts.set(count, (voteCounts.get(count) || 0) + 1);
      }
      
      for (let i = 1; i <= 4; i++) {
        const count = voteCounts.get(i) || 0;
        console.log(`Voted in ${i} poll(s): ${count} users`);
      }
      
      process.exit(0);
      
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });
  
  client.login(DISCORD_BOT_TOKEN);
}

main();
