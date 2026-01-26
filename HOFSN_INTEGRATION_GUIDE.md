# HOFSN Discord Integration Guide

This guide explains how to integrate the HOFSN website with the Discord bot to automatically post new articles.

## Overview

When a new article is published on HOFSN, it will automatically post to Discord channel `1438492724381876405` as an embed with:
- Article title (clickable link)
- Featured image (highlight card)
- Optional excerpt
- Optional author
- Timestamp

## Webhook Endpoint

**URL**: `https://your-nba2k26-database-url.manus.space/api/hofsn-webhook/article`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Payload**:
```json
{
  "title": "Article Title",
  "url": "https://hofsn-sports-bu28nutg.manus.space/articles/article-slug",
  "imageUrl": "https://example.com/highlight-card.png",
  "excerpt": "Optional article summary",
  "author": "Optional author name",
  "publishedAt": "2026-01-25T12:00:00Z"
}
```

**Required fields**: `title`, `url`, `imageUrl`

**Optional fields**: `excerpt`, `author`, `publishedAt`

## Integration Steps for HOFSN Project

### Step 1: Add Webhook URL as Environment Variable

In your HOFSN project, add this to `.env`:

```env
DISCORD_WEBHOOK_URL=https://your-nba2k26-database-url.manus.space/api/hofsn-webhook/article
```

### Step 2: Create Webhook Helper Function

Create a file `server/utils/discordWebhook.ts` (or similar) in your HOFSN project:

```typescript
interface ArticleWebhookPayload {
  title: string;
  url: string;
  imageUrl: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
}

export async function notifyDiscordNewArticle(article: ArticleWebhookPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('[Discord] Webhook URL not configured, skipping notification');
    return;
  }

  try {
    console.log('[Discord] Posting article to Discord:', article.title);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Discord] Failed to post article:', error);
      return;
    }

    console.log('[Discord] Article posted successfully');
  } catch (error) {
    console.error('[Discord] Error posting article:', error);
    // Don't throw - we don't want article creation to fail if Discord posting fails
  }
}
```

### Step 3: Call Webhook After Article Creation

In your article creation/publishing logic (likely in a tRPC mutation or API route), add:

```typescript
import { notifyDiscordNewArticle } from './utils/discordWebhook';

// After successfully creating/publishing the article:
await notifyDiscordNewArticle({
  title: article.title,
  url: `https://hofsn-sports-bu28nutg.manus.space/articles/${article.slug}`,
  imageUrl: article.featuredImage, // Your highlight card URL
  excerpt: article.excerpt,
  author: article.author,
  publishedAt: article.publishedAt.toISOString(),
});
```

### Step 4: Test the Integration

1. Start both projects (NBA 2K26 database + HOFSN)
2. Ensure the Discord bot is online
3. Publish a test article on HOFSN
4. Check Discord channel `1438492724381876405` for the post

## Testing Without Publishing

You can test the webhook manually using the provided test script:

```bash
cd /path/to/nba2k26-database
npx tsx scripts/test-hofsn-webhook.ts
```

Or use curl:

```bash
curl -X POST http://localhost:3000/api/hofsn-webhook/article \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "url": "https://hofsn-sports-bu28nutg.manus.space/test",
    "imageUrl": "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png"
  }'
```

## Health Check

Check if the webhook is ready:

```bash
curl http://localhost:3000/api/hofsn-webhook/health
```

Response:
```json
{
  "status": "ok",
  "botConnected": true,
  "timestamp": "2026-01-25T12:00:00.000Z"
}
```

## Troubleshooting

### Article not posting to Discord

1. **Check bot status**: Verify the Discord bot is online
2. **Check webhook health**: `curl http://localhost:3000/api/hofsn-webhook/health`
3. **Check bot logs**: Look for `[HOFSN]` prefixed messages
4. **Verify channel ID**: Ensure `1438492724381876405` is correct
5. **Check bot permissions**: Bot needs "Send Messages" and "Embed Links" permissions in the channel

### Webhook returns 503 error

The Discord bot is not connected. Restart the bot:
```bash
cd /path/to/nba2k26-database
pkill -f "start-bot"
nohup npx tsx start-bot.mjs > bot.log 2>&1 &
```

### Webhook returns 400 error

Missing required fields (`title`, `url`, or `imageUrl`). Check your payload.

## Production Deployment

When deploying to production:

1. Update `DISCORD_WEBHOOK_URL` in HOFSN's production environment to use the production NBA 2K26 database URL
2. Ensure the Discord bot is running in production
3. Test with a sample article before going live

## Example Discord Embed

The posted embed will look like:

```
┌─────────────────────────────────────┐
│ 🏀 Lakers Dominate in Season Opener│  ← Title (clickable)
├─────────────────────────────────────┤
│                                     │
│     [Featured Image/Highlight]      │  ← Your highlight card
│                                     │
├─────────────────────────────────────┤
│ Article summary text here...        │  ← Excerpt (if provided)
├─────────────────────────────────────┤
│ By Author Name                      │  ← Author (if provided)
│ Jan 25, 2026 at 12:00 PM           │  ← Timestamp
└─────────────────────────────────────┘
```

## Support

If you encounter issues, check:
- Bot logs: `/home/ubuntu/nba2k26-database/bot.log`
- Server logs: Check the dev server console
- Discord bot status in the admin panel
