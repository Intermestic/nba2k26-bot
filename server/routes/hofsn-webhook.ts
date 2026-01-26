import express from 'express';

const router = express.Router();
const HOFSN_BOT_SERVER_URL = 'http://localhost:3002';

interface HOFSNWebhookPayload {
  title: string;
  url: string;
  imageUrl: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
}

/**
 * Webhook endpoint for HOFSN to post new articles
 * POST /api/hofsn-webhook/article
 */
router.post('/article', async (req, res) => {
  try {
    console.log('[HOFSN Webhook] Proxying article to bot server:', req.body.title);

    // Forward to bot server
    const response = await fetch(`${HOFSN_BOT_SERVER_URL}/article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[HOFSN Webhook] Bot server error:', data);
      return res.status(response.status).json(data);
    }

    console.log('[HOFSN Webhook] Article posted successfully');
    res.json(data);
  } catch (error) {
    console.error('[HOFSN Webhook] Error proxying to bot server:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Bot server unreachable' 
    });
  }
});

/**
 * Health check endpoint
 * GET /api/hofsn-webhook/health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${HOFSN_BOT_SERVER_URL}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json({
      status: 'error',
      botConnected: false,
      error: 'Bot server unreachable',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
