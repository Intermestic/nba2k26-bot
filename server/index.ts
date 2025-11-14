import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { startDiscordBot } from "./discord-bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
  
  // Start Discord bot if token is provided
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (botToken) {
    try {
      await startDiscordBot(botToken);
      console.log('[Discord Bot] Started successfully');
    } catch (error) {
      console.error('[Discord Bot] Failed to start:', error);
    }
  } else {
    console.log('[Discord Bot] Token not provided, skipping bot startup');
  }
}

startServer().catch(console.error);
