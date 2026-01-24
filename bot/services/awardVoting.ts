import { Client, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, AttachmentBuilder } from 'discord.js';
import { DatabaseService } from './database';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const VOTING_CHANNEL_ID = '1464505967394816236'; // Production voting channel
const ADMIN_TEST_CHANNEL_ID = '1444709506499088467'; // Admin channel for testing
const VOTE_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// Award types
type AwardType = 'MVP' | 'DPOY' | 'ROY' | '6MOY';

interface AwardCandidate {
  name: string;
  team: string;
  stats?: string;
}

interface AwardPoll {
  awardType: AwardType;
  candidates: AwardCandidate[];
  description?: string;
}

// Poll data from user request - SZN 17 Awards
const AWARD_POLLS: AwardPoll[] = [
  {
    awardType: 'MVP',
    candidates: [
      { name: 'Jayson Tatum', team: 'Raptors', stats: '37.25 PPG | 4.97 APG | FG 63.8% | +/- 1253' },
      { name: 'Brandon Ingram', team: 'Pistons', stats: '38.80 PPG | FG 60.7% | 3P 50.4% | FT 90.9%' },
      { name: 'Stephen Curry', team: 'Nuggets', stats: '37.11 PPG | 6.08 APG | 3P 61.2% | FT 94.5%' },
      { name: 'Jalen Suggs', team: 'Wizards', stats: '35.80 PPG | 2.07 SPG | OppFG% 43.9%' },
      { name: 'Jalen Johnson', team: 'Hawks', stats: '34.34 PPG | FG 65.6% | FT 89.7%' },
    ],
    description: '"MVP" isn\'t a points title. It\'s the player who turns tight fourth quarters into order, who wins games you weren\'t supposed to lose. Who owned SZN 17 when it mattered most?',
  },
  {
    awardType: 'DPOY',
    candidates: [
      { name: 'OG Anunoby', team: 'Raptors', stats: 'DIS 90.51 | 2.50 SPG | OppFG 47.04% | +/- 1248' },
      { name: 'Jalen Suggs', team: 'Wizards', stats: 'DIS 88.00 | OppFG 43.97% | 2.07 SPG' },
      { name: 'Cason Wallace', team: 'Mavericks', stats: 'DIS 76.66 | 2.14 SPG | +/- 757' },
      { name: 'Kristaps Porzingis', team: 'Rockets', stats: 'DIS 73.33 | 62 BLK | 64 STL' },
    ],
    description: '"DPOY" is the defender you can\'t solve. The one you feel even when he isn\'t guarding you. Who defined defense in SZN 17?',
  },
  {
    awardType: 'ROY',
    candidates: [
      { name: 'Jamir Watkins', team: 'Pistons', stats: '13.69 PPG | 2.73 APG | +/- 502' },
      { name: 'Egor Demin', team: 'Magic', stats: '10.46 PPG | 3.22 APG | FG 53.9%' },
      { name: 'Jeremiah Fears', team: 'Grizzlies', stats: '9.69 PPG | 2.71 APG | 48 STL' },
    ],
    description: 'Rookie of the Year is about announcing yourself. Who made the jump from "new guy" to "we have to gameplan for him" the fastest?',
  },
  {
    awardType: '6MOY',
    candidates: [
      { name: 'Kentavious Caldwell-Pope', team: 'Nuggets', stats: '17.23 PPG | FG 58.0% | 3P 52.8%' },
      { name: 'Donte DiVincenzo', team: 'Cavaliers', stats: '16.09 PPG | 3.95 APG | 58 STL' },
      { name: 'Anfernee Simons', team: 'Spurs', stats: '15.58 PPG | 3.42 APG | 47 STL' },
      { name: 'R.J. Barrett', team: 'Bucks', stats: '14.75 PPG | 2.86 APG | 53 STL' },
      { name: 'Deandre Ayton', team: 'Pistons', stats: '11.10 PPG | 7.74 RPG | 68 BLK' },
    ],
    description: 'Sixth Man is controlled chaos—the first sub who changes the temperature of the game. Who owned the second unit and made it feel like a weapon?',
  },
];

// Trophy image paths
const TROPHY_IMAGES: Record<AwardType, string> = {
  MVP: path.join(__dirname, '../../assets/trophies/mvp-trophy.png'),
  DPOY: path.join(__dirname, '../../assets/trophies/dpoy-trophy.png'),
  ROY: path.join(__dirname, '../../assets/trophies/roy-trophy.png'),
  '6MOY': path.join(__dirname, '../../assets/trophies/6moy-trophy.png'),
};

// Award full names
const AWARD_NAMES: Record<AwardType, string> = {
  MVP: 'Most Valuable Player',
  DPOY: 'Defensive Player of the Year',
  ROY: 'Rookie of the Year',
  '6MOY': 'Sixth Man of the Year',
};

// Trophy names
const TROPHY_NAMES: Record<AwardType, string> = {
  MVP: 'The Michael Jordan Trophy',
  DPOY: 'The Hakeem Olajuwon Trophy',
  ROY: 'The Wilt Chamberlain Trophy',
  '6MOY': 'The John Havlicek Trophy',
};

// Emoji reactions for voting (numbered 1-5)
const VOTE_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

// Team abbreviations to full names mapping
const TEAM_ABBREV_MAP: Record<string, string> = {
  'Thunder': 'OKC',
  'Nuggets': 'DEN',
  'Bucks': 'MIL',
  'Celtics': 'BOS',
  'Timberwolves': 'MIN',
  'Spurs': 'SAS',
  'Heat': 'MIA',
  'Grizzlies': 'MEM',
  'Hawks': 'ATL',
  'Lakers': 'LAL',
  'Pelicans': 'NOP',
  'Clippers': 'LAC',
  'Kings': 'SAC',
};

// Store active polls
interface ActivePoll {
  messageId: string;
  channelId: string;
  awardType: AwardType;
  candidates: AwardCandidate[];
  votes: Map<string, number>; // userId -> candidateIndex
  endTime: Date;
  isPreview: boolean;
}

const activePolls: Map<string, ActivePoll> = new Map();

export class AwardVotingService {
  private client: Client;
  private pollTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(client: Client) {
    this.client = client;
  }

  async initialize(): Promise<void> {
    console.log('[AwardVoting] Initializing award voting service...');
    
    // Set up reaction collector for vote handling
    this.client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      await this.handleVote(reaction, user, 'add');
    });

    this.client.on('messageReactionRemove', async (reaction, user) => {
      if (user.bot) return;
      await this.handleVote(reaction, user, 'remove');
    });

    console.log('[AwardVoting] Award voting service initialized');
  }

  private async handleVote(reaction: any, user: any, action: 'add' | 'remove'): Promise<void> {
    const poll = activePolls.get(reaction.message.id);
    if (!poll) return;

    const emojiIndex = VOTE_EMOJIS.indexOf(reaction.emoji.name);
    if (emojiIndex === -1) return;

    if (action === 'add') {
      // Check if user already voted for a different option
      const existingVote = poll.votes.get(user.id);
      if (existingVote !== undefined && existingVote !== emojiIndex) {
        // Remove their previous vote reaction
        try {
          const previousEmoji = VOTE_EMOJIS[existingVote];
          const message = await reaction.message.fetch();
          const previousReaction = message.reactions.cache.find((r: any) => r.emoji.name === previousEmoji);
          if (previousReaction) {
            await previousReaction.users.remove(user.id);
          }
        } catch (err) {
          console.error('[AwardVoting] Error removing previous vote:', err);
        }
      }
      
      // Record new vote
      poll.votes.set(user.id, emojiIndex);
      console.log(`[AwardVoting] ${user.username} voted for option ${emojiIndex + 1} in ${poll.awardType}`);
    } else if (action === 'remove') {
      // Only remove if this was their current vote
      if (poll.votes.get(user.id) === emojiIndex) {
        poll.votes.delete(user.id);
        console.log(`[AwardVoting] ${user.username} removed vote from ${poll.awardType}`);
      }
    }
  }

  async getPlayerInfo(playerName: string): Promise<{ photoUrl: string | null; teamLogoUrl: string | null }> {
    try {
      const result = await DatabaseService.query(
        'SELECT photo_url, team FROM players WHERE name = ? LIMIT 1',
        [playerName]
      );
      
      if (result.length > 0) {
        const player = result[0] as any;
        // Get team logo URL (you may need to adjust this based on your database structure)
        const teamLogoUrl = player.team ? `https://cdn.nba.com/logos/nba/${this.getTeamId(player.team)}/primary/L/logo.svg` : null;
        return {
          photoUrl: player.photo_url || null,
          teamLogoUrl,
        };
      }
    } catch (err) {
      console.error('[AwardVoting] Error fetching player info:', err);
    }
    return { photoUrl: null, teamLogoUrl: null };
  }

  private getTeamId(teamName: string): string {
    // NBA team IDs for logo URLs
    const teamIds: Record<string, string> = {
      'Hawks': '1610612737',
      'Celtics': '1610612738',
      'Nets': '1610612751',
      'Hornets': '1610612766',
      'Bulls': '1610612741',
      'Cavaliers': '1610612739',
      'Mavericks': '1610612742',
      'Nuggets': '1610612743',
      'Pistons': '1610612765',
      'Warriors': '1610612744',
      'Rockets': '1610612745',
      'Pacers': '1610612754',
      'Clippers': '1610612746',
      'Lakers': '1610612747',
      'Grizzlies': '1610612763',
      'Heat': '1610612748',
      'Bucks': '1610612749',
      'Timberwolves': '1610612750',
      'Pelicans': '1610612740',
      'Knicks': '1610612752',
      'Thunder': '1610612760',
      'Magic': '1610612753',
      '76ers': '1610612755',
      'Suns': '1610612756',
      'Trail Blazers': '1610612757',
      'Kings': '1610612758',
      'Spurs': '1610612759',
      'Raptors': '1610612761',
      'Jazz': '1610612762',
      'Wizards': '1610612764',
    };
    return teamIds[teamName] || '1610612737';
  }

  async createPollEmbed(poll: AwardPoll, isPreview: boolean = false): Promise<{ embed: EmbedBuilder; attachment: AttachmentBuilder }> {
    const { awardType, candidates, description } = poll;
    
    // Load trophy image
    const trophyPath = TROPHY_IMAGES[awardType];
    const trophyBuffer = fs.readFileSync(trophyPath);
    const attachment = new AttachmentBuilder(trophyBuffer, { name: `${awardType.toLowerCase()}-trophy.png` });

    // Build candidate list with player info
    let candidateList = '';
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const playerInfo = await this.getPlayerInfo(candidate.name);
      const teamAbbrev = TEAM_ABBREV_MAP[candidate.team] || candidate.team;
      
      candidateList += `${VOTE_EMOJIS[i]} **${candidate.name}** (${teamAbbrev})\n`;
      if (candidate.stats) {
        candidateList += `   📊 ${candidate.stats}\n`;
      }
      candidateList += '\n';
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${AWARD_NAMES[awardType]} ${isPreview ? '(PREVIEW)' : ''}`)
      .setDescription(`**${TROPHY_NAMES[awardType]}**\n\n${description || ''}\n\n**Candidates:**\n${candidateList}`)
      .setColor(0xFFD700) // Gold color
      .setThumbnail(`attachment://${awardType.toLowerCase()}-trophy.png`)
      .setFooter({ text: isPreview ? '⚠️ PREVIEW MODE - Votes will not count' : `Vote by reacting below • Poll ends in 8 hours` })
      .setTimestamp();

    if (!isPreview) {
      const endTime = new Date(Date.now() + VOTE_DURATION_MS);
      embed.addFields({ name: '⏰ Voting Ends', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true });
    }

    return { embed, attachment };
  }

  async postPoll(channelId: string, poll: AwardPoll, isPreview: boolean = false): Promise<Message | null> {
    try {
      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (!channel) {
        console.error(`[AwardVoting] Channel ${channelId} not found`);
        return null;
      }

      const { embed, attachment } = await this.createPollEmbed(poll, isPreview);
      
      const message = await channel.send({
        embeds: [embed],
        files: [attachment],
      });

      // Add reaction options
      for (let i = 0; i < poll.candidates.length; i++) {
        await message.react(VOTE_EMOJIS[i]);
      }

      // Store active poll
      const activePoll: ActivePoll = {
        messageId: message.id,
        channelId,
        awardType: poll.awardType,
        candidates: poll.candidates,
        votes: new Map(),
        endTime: new Date(Date.now() + VOTE_DURATION_MS),
        isPreview,
      };
      activePolls.set(message.id, activePoll);

      // Set timer for poll end (only for non-preview)
      if (!isPreview) {
        const timer = setTimeout(() => this.endPoll(message.id), VOTE_DURATION_MS);
        this.pollTimers.set(message.id, timer);
      }

      console.log(`[AwardVoting] Posted ${poll.awardType} poll in channel ${channelId} (preview: ${isPreview})`);
      return message;
    } catch (err) {
      console.error('[AwardVoting] Error posting poll:', err);
      return null;
    }
  }

  async postAllPreviewPolls(): Promise<void> {
    console.log('[AwardVoting] Posting all preview polls to admin channel...');
    
    for (const poll of AWARD_POLLS) {
      await this.postPoll(ADMIN_TEST_CHANNEL_ID, poll, true);
      // Wait a bit between posts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('[AwardVoting] All preview polls posted');
  }

  async postAllLivePolls(): Promise<void> {
    console.log('[AwardVoting] Posting all live polls to voting channel...');
    
    for (const poll of AWARD_POLLS) {
      await this.postPoll(VOTING_CHANNEL_ID, poll, false);
      // Wait a bit between posts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('[AwardVoting] All live polls posted');
  }

  async endPoll(messageId: string): Promise<void> {
    const poll = activePolls.get(messageId);
    if (!poll || poll.isPreview) return;

    console.log(`[AwardVoting] Ending poll for ${poll.awardType}`);

    try {
      const channel = await this.client.channels.fetch(poll.channelId) as TextChannel;
      const message = await channel.messages.fetch(messageId);

      // Count votes
      const voteCounts: number[] = new Array(poll.candidates.length).fill(0);
      poll.votes.forEach((candidateIndex) => {
        voteCounts[candidateIndex]++;
      });

      // Find winner
      const maxVotes = Math.max(...voteCounts);
      const winnerIndex = voteCounts.indexOf(maxVotes);
      const winner = poll.candidates[winnerIndex];
      const totalVotes = voteCounts.reduce((a, b) => a + b, 0);

      // Build results embed
      let resultsText = '';
      for (let i = 0; i < poll.candidates.length; i++) {
        const candidate = poll.candidates[i];
        const votes = voteCounts[i];
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
        const bar = '█'.repeat(Math.round(votes / Math.max(maxVotes, 1) * 10)) + '░'.repeat(10 - Math.round(votes / Math.max(maxVotes, 1) * 10));
        const isWinner = i === winnerIndex ? '👑 ' : '';
        resultsText += `${isWinner}**${candidate.name}**: ${votes} votes (${percentage}%)\n${bar}\n\n`;
      }

      const resultsEmbed = new EmbedBuilder()
        .setTitle(`🏆 ${AWARD_NAMES[poll.awardType]} - RESULTS`)
        .setDescription(`**${TROPHY_NAMES[poll.awardType]}**\n\n🎉 **Winner: ${winner.name}** 🎉\n\n${resultsText}`)
        .setColor(0x00FF00)
        .addFields({ name: '📊 Total Votes', value: totalVotes.toString(), inline: true })
        .setFooter({ text: 'Voting has ended' })
        .setTimestamp();

      // Post results
      await channel.send({ embeds: [resultsEmbed] });

      // Update original message to show voting ended
      const originalEmbed = message.embeds[0];
      if (originalEmbed) {
        const updatedEmbed = EmbedBuilder.from(originalEmbed)
          .setFooter({ text: '🔒 Voting has ended - See results below' })
          .setColor(0x808080);
        await message.edit({ embeds: [updatedEmbed] });
      }

      // Clean up
      activePolls.delete(messageId);
      this.pollTimers.delete(messageId);

      console.log(`[AwardVoting] Poll ended for ${poll.awardType}. Winner: ${winner.name} with ${maxVotes} votes`);
    } catch (err) {
      console.error('[AwardVoting] Error ending poll:', err);
    }
  }

  getActivePolls(): ActivePoll[] {
    return Array.from(activePolls.values());
  }
}

// Singleton instance
let awardVotingService: AwardVotingService | null = null;

export function initializeAwardVoting(client: Client): AwardVotingService {
  if (!awardVotingService) {
    awardVotingService = new AwardVotingService(client);
  }
  return awardVotingService;
}

export function getAwardVotingService(): AwardVotingService | null {
  return awardVotingService;
}
