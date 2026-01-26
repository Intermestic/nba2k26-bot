/**
 * Test script for HOFSN webhook
 * 
 * This script sends a test article to the Discord bot via the webhook endpoint.
 * Use this to verify the integration is working correctly.
 * 
 * Usage: npx tsx scripts/test-hofsn-webhook.ts
 */

const WEBHOOK_URL = 'http://localhost:3000/api/hofsn-webhook/article';

const testArticle = {
  title: "🏀 Test Article: Lakers Dominate in Season Opener",
  url: "https://hofsn-sports-bu28nutg.manus.space/articles/test-article",
  imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png", // LeBron James
  excerpt: "This is a test article to verify the HOFSN webhook integration is working correctly.",
  author: "HOFSN Sports Network",
  publishedAt: new Date().toISOString()
};

async function testWebhook() {
  console.log('🧪 Testing HOFSN webhook...\n');
  console.log('Sending test article:', testArticle.title);
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testArticle),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Webhook test successful!');
      console.log('Response:', data);
      console.log('');
      console.log('Check Discord channel 1438492724381876405 to see the posted article.');
    } else {
      console.error('❌ Webhook test failed!');
      console.error('Status:', response.status);
      console.error('Response:', data);
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
    console.error('');
    console.error('Make sure:');
    console.error('1. The dev server is running (pnpm dev)');
    console.error('2. The Discord bot is online');
    console.error('3. The webhook URL is correct');
  }
}

testWebhook();
