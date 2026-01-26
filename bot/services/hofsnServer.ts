import express from 'express';
import { Client } from 'discord.js';
import { postHOFSNArticle } from './hofsnWebhook';
import { logger } from './logger';

const HOFSN_BOT_PORT = 3002;

interface HOFSNWebhookPayload {
  title: string;
  url: string;
  imageUrl: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
}

/**
 * Start HTTP server in bot process to receive HOFSN webhooks
 */
export function startHOFSNServer(client: Client): void {
  const app = express();
  
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      botReady: client.isReady(),
      timestamp: new Date().toISOString()
    });
  });

  // Webhook endpoint
  app.post('/article', async (req, res) => {
    try {
      logger.info('[HOFSN Server] Received article webhook');
      
      const payload: HOFSNWebhookPayload = req.body;

      // Validate required fields
      if (!payload.title || !payload.url || !payload.imageUrl) {
        logger.error('[HOFSN Server] Missing required fields:', payload);
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, url, imageUrl'
        });
      }

      if (!client.isReady()) {
        logger.error('[HOFSN Server] Bot not ready');
        return res.status(503).json({
          success: false,
          error: 'Bot not ready'
        });
      }

      // Post to Discord
      await postHOFSNArticle(client, payload);

      logger.info('[HOFSN Server] Article posted successfully:', payload.title);
      
      res.json({
        success: true,
        message: 'Article posted to Discord'
      });
    } catch (error) {
      logger.error('[HOFSN Server] Error processing webhook:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.listen(HOFSN_BOT_PORT, () => {
    logger.info(`[HOFSN Server] Listening on port ${HOFSN_BOT_PORT}`);
  });
}
