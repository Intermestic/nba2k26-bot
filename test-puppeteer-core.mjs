import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const execPath = "/usr/lib/chromium-browser/chromium-browser";

console.log("File exists:", existsSync(execPath));

try {
  console.log("Launching with puppeteer-core...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--single-process",
    ],
    executablePath: execPath,
    timeout: 30000,
  });
  
  console.log("✅ Success!");
  await browser.close();
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Error name:", error.name);
  console.error("Error constructor:", error.constructor.name);
  console.error("Full error:", error);
}
