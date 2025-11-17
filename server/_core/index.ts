import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { publicApiRouter } from "./publicApi";
import imageProxyRouter from "./imageProxy";
import { startDiscordBot } from "../discord-bot";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Public REST API (no auth required)
  app.use("/api/public", publicApiRouter);
  // Image proxy for CORS-free image access
  app.use("/api", imageProxyRouter);
  // FA transactions history API
  const faTransactionsRouter = (await import('../routes/fa-transactions')).default;
  app.use("/api/fa-transactions", faTransactionsRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Start Discord bot if token is available
  const botToken = process.env.DISCORD_BOT_TOKEN;
  console.log('[Discord Bot] Checking for DISCORD_BOT_TOKEN...', botToken ? 'Found' : 'Not found');
  if (botToken) {
    try {
      console.log('[Discord Bot] Attempting to start bot...');
      await startDiscordBot(botToken);
      console.log('[Discord Bot] ✅ Started successfully');
    } catch (error) {
      console.error('[Discord Bot] ❌ Failed to start:', error);
      if (error instanceof Error) {
        console.error('[Discord Bot] Error details:', error.message);
        console.error('[Discord Bot] Stack trace:', error.stack);
      }
    }
  } else {
    console.log('[Discord Bot] ⚠️  DISCORD_BOT_TOKEN not found, bot will not start');
  }
}

startServer().catch(console.error);
