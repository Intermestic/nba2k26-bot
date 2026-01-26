import { Client, EmbedBuilder, TextChannel } from 'discord.js';

const HOFSN_CHANNEL_ID = '1438492724381876405';

interface HOFSNArticle {
  title: string;
  url: string;
  imageUrl: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
}

export async function postHOFSNArticle(client: Client, article: HOFSNArticle): Promise<void> {
  try {
    console.log('[HOFSN] Posting article to Discord:', article.title);

    const channel = await client.channels.fetch(HOFSN_CHANNEL_ID);
    
    if (!channel || !(channel instanceof TextChannel)) {
      console.error('[HOFSN] Channel not found or not a text channel:', HOFSN_CHANNEL_ID);
      throw new Error('HOFSN channel not found or not accessible');
    }

    const embed = new EmbedBuilder()
      .setTitle(article.title)
      .setURL(article.url)
      .setImage(article.imageUrl)
      .setColor(0xFFD700) // Gold color for HOFSN branding
      .setTimestamp(article.publishedAt ? new Date(article.publishedAt) : new Date());

    if (article.excerpt) {
      embed.setDescription(article.excerpt);
    }

    if (article.author) {
      embed.setFooter({ text: `By ${article.author}` });
    }

    await channel.send({ embeds: [embed] });
    
    console.log('[HOFSN] Successfully posted article:', article.title);
  } catch (error) {
    console.error('[HOFSN] Error posting article to Discord:', error);
    throw error;
  }
}

export function setupHOFSNWebhook(client: Client): void {
  console.log('[HOFSN] Webhook handler initialized');
  // Webhook endpoint will be added to the Express server in start-bot.mjs
}
