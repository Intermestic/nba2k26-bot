/**
 * Discord Webhook Helper
 * Posts new articles/highlights to Discord via the NBA 2K26 database bot webhook
 */

interface ArticleWebhookPayload {
  title: string;
  url: string;
  imageUrl: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
}

/**
 * Notify Discord about a new article/highlight via the webhook
 * @param article - The article/highlight data to post
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function notifyDiscordNewArticle(article: ArticleWebhookPayload): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('[Discord] Webhook URL not configured, skipping notification');
    return false;
  }

  try {
    console.log('[Discord] Posting article to Discord:', article.title);
    
    // Format payload for custom bot (not standard Discord webhook)
    const discordPayload = {
      content: '<@&1072321441858605137>',  // Mention the hof assoc role
      title: article.title,
      url: article.url,
      imageUrl: article.imageUrl,
      excerpt: article.excerpt || undefined,
      author: article.author || undefined,
      publishedAt: article.publishedAt || undefined
    };
    
    console.log('[Discord] Payload:', JSON.stringify(discordPayload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Discord] Failed to post article');
      console.error('[Discord] Status:', response.status, response.statusText);
      console.error('[Discord] Response:', errorText);
      console.error('[Discord] Payload sent:', JSON.stringify(discordPayload, null, 2));
      return false;
    }

    console.log('[Discord] Article posted successfully');
    return true;
  } catch (error) {
    console.error('[Discord] Error posting article:', error);
    // Don't throw - we don't want article creation to fail if Discord posting fails
    return false;
  }
}

/**
 * Delete an article/highlight from Discord via the webhook
 * @param articleUrl - The URL of the article to delete (used to identify the message)
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function deleteDiscordArticle(articleUrl: string): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('[Discord] Webhook URL not configured, skipping delete');
    return false;
  }

  try {
    console.log('[Discord] Deleting article from Discord:', articleUrl);
    
    // Use DELETE method with the article URL as identifier
    const deleteUrl = webhookUrl.replace('/article', '/delete');
    
    const response = await fetch(deleteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: articleUrl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Discord] Failed to delete article:', response.status, errorText);
      return false;
    }

    console.log('[Discord] Article deleted successfully');
    return true;
  } catch (error) {
    console.error('[Discord] Error deleting article:', error);
    return false;
  }
}

/**
 * Check if the Discord webhook is healthy/available
 * @returns Promise<{status: string, botConnected: boolean}> - Health check result
 */
export async function checkDiscordWebhookHealth(): Promise<{status: string, botConnected: boolean, timestamp?: string}> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return { status: 'not_configured', botConnected: false };
  }

  try {
    // Replace /article with /health for the health check endpoint
    const healthUrl = webhookUrl.replace('/article', '/health');
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { status: 'error', botConnected: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Discord] Error checking webhook health:', error);
    return { status: 'error', botConnected: false };
  }
}
