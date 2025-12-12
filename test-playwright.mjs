import { chromium } from 'playwright';

console.log("Testing Playwright with system chromium...");

try {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/lib/chromium-browser/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  
  console.log("✅ Browser launched successfully!");
  
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const title = await page.title();
  console.log("✅ Page loaded! Title:", title);
  
  await browser.close();
  console.log("✅ All tests passed!");
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error(error);
}
