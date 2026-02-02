const webhookUrl = "https://3002-iw5sv9xoqslak0e8gwxe4-3fb1e986.sg1.manus.computer/article";

console.log("Testing Discord Webhook with Bot Mention...");
console.log("Webhook URL:", webhookUrl);

const payload = {
  content: "@hof assoc",
  title: "🧪 Test Post with Bot Mention",
  url: "https://hofsn-sports-bu28nutg.manus.space/playoffs",
  imageUrl: "https://hofsn-sports-bu28nutg.manus.space/highlights/hawks-sweep-hornets.png",
  excerpt: "Testing bot mention in Discord webhook"
};

console.log("Payload:", JSON.stringify(payload, null, 2));
console.log("Sending request...");

try {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  console.log("Response status:", response.status);
  console.log("Response statusText:", response.statusText);
  
  const responseBody = await response.json();
  console.log("Response body:", JSON.stringify(responseBody, null, 2));
  
  if (response.ok) {
    console.log("✅ SUCCESS! Message with bot mention posted to Discord");
  } else {
    console.log("❌ FAILED! Status:", response.status);
  }
} catch (error) {
  console.error("❌ ERROR:", error.message);
}
