const webhookUrl = "https://3002-iw5sv9xoqslak0e8gwxe4-3fb1e986.sg1.manus.computer/article";

console.log("Testing Discord Webhook with Role ID Mention...");

const payload = {
  content: "<@&1072321441858605137>",
  title: "🧪 Test Post with Role Mention",
  url: "https://hofsn-sports-bu28nutg.manus.space/playoffs",
  imageUrl: "https://hofsn-sports-bu28nutg.manus.space/highlights/hawks-sweep-hornets.png",
  excerpt: "Testing role ID mention in Discord webhook"
};

console.log("Payload:", JSON.stringify(payload, null, 2));

try {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json();
  console.log("Response:", response.status, JSON.stringify(responseBody, null, 2));
  
  if (response.ok) {
    console.log("✅ SUCCESS! Role mention posted to Discord");
  } else {
    console.log("❌ FAILED!");
  }
} catch (error) {
  console.error("❌ ERROR:", error.message);
}
