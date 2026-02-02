const webhookUrl = 'http://138.197.26.235:3002/article';

const testPayload = {
  title: "🧪 Test: Discord Webhook Update",
  url: "https://hofsn-sports-bu28nutg.manus.space/playoffs",
  imageUrl: "https://hofsn-sports-bu28nutg.manus.space/hofsn-logo.png",
  excerpt: "Testing new webhook endpoint at http://138.197.26.235:3002/article",
  content: "<@&1072321441858605137>"
};

console.log('[Test] Sending test message to new webhook...');
console.log('[Test] Webhook URL:', webhookUrl);
console.log('[Test] Payload:', JSON.stringify(testPayload, null, 2));

try {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });
  
  console.log('[Test] Response status:', response.status);
  const text = await response.text();
  console.log('[Test] Response body:', text);
  
  if (response.ok) {
    console.log('[Test] ✅ Webhook test successful!');
  } else {
    console.log('[Test] ❌ Webhook test failed');
  }
} catch (error) {
  console.error('[Test] Error:', error.message);
}
