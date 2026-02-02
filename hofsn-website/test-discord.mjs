import 'dotenv/config';

const webhookUrl = 'https://3002-iw5sv9xoqslak0e8gwxe4-3fb1e986.sg1.manus.computer/article';

console.log('Testing Discord Webhook...');
console.log('Webhook URL:', webhookUrl ? `${webhookUrl.substring(0, 50)}...` : 'NOT SET');

if (!webhookUrl) {
  console.error('❌ DISCORD_WEBHOOK_URL not set');
  process.exit(1);
}

const testPayload = {
  title: '🧪 Test Post from HoFSN',
  url: 'https://hofsn-sports-bu28nutg.manus.space/playoffs',
  imageUrl: 'https://hofsn-sports-bu28nutg.manus.space/highlights/hawks-sweep-hornets.png',
  excerpt: 'Testing Discord webhook integration'
};

console.log('\nPayload:', JSON.stringify(testPayload, null, 2));

try {
  console.log('\nSending request...');
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testPayload),
  });

  console.log('Response status:', response.status);
  console.log('Response statusText:', response.statusText);

  const responseText = await response.text();
  console.log('Response body:', responseText || '(empty)');

  if (response.ok) {
    console.log('\n✅ SUCCESS! Message posted to Discord');
  } else {
    console.log('\n❌ FAILED! Discord returned error');
  }
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('Stack:', error.stack);
}
