# Deployment Guide - NBA 2K26 Database

This guide explains how to deploy the NBA 2K26 Database application with the Discord bot running continuously.

## Architecture

The application consists of two main components:

1. **Web Server** (`dist/index.js`) - Serves the web application and API
2. **Discord Bot** (`dist/bot-standalone.js`) - Runs the Discord bot as a standalone process

Both components need to run simultaneously and stay online 24/7.

## Deployment Options

### Option 1: Manus Built-in Hosting (Recommended)

The easiest way to deploy is using Manus's built-in hosting:

1. **Create a checkpoint** in the Manus interface
2. **Click the Publish button** in the Management UI header
3. The bot will automatically start and stay running on Manus servers

**Advantages:**
- Zero configuration required
- Automatic SSL certificates
- Built-in monitoring and restarts
- Same hosting as your web app
- Custom domain support

**Note:** The current `start` script in `package.json` will launch both the web server and bot automatically when deployed.

### Option 2: Using PM2 Process Manager

If you're deploying to your own server (VPS, cloud instance, etc.), use PM2 for process management:

#### Installation

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
pnpm build

# Start both processes with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

#### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs
pm2 logs nba2k26-web
pm2 logs nba2k26-bot

# Restart processes
pm2 restart all
pm2 restart nba2k26-web
pm2 restart nba2k26-bot

# Stop processes
pm2 stop all

# Delete processes
pm2 delete all
```

### Option 3: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Expose ports
EXPOSE 3000 3001

# Start both services
CMD ["sh", "-c", "node dist/index.js & node dist/bot-standalone.js & wait"]
```

Build and run:

```bash
docker build -t nba2k26-database .
docker run -d -p 3000:3000 -p 3001:3001 --env-file .env nba2k26-database
```

### Option 4: External Hosting Services

#### Railway.app

1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Railway will automatically detect and run the `start` script
4. Both web server and bot will start automatically

#### Render.com

1. Create a new Web Service
2. Set build command: `pnpm install && pnpm build`
3. Set start command: `pnpm start`
4. Add environment variables
5. Deploy

## Environment Variables

Ensure these environment variables are set in production:

```bash
# Database
DATABASE_URL=mysql://...

# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token_here

# OAuth (if using authentication)
OAUTH_SERVER_URL=...
JWT_SECRET=...

# Other required variables
OWNER_NAME=...
OWNER_OPEN_ID=...
```

## Monitoring Bot Status

### Health Check Endpoint

The bot exposes a health check endpoint at `http://localhost:3001/health`:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "botReady": true,
  "botUsername": "HOF 2K Manus Bot#0960"
}
```

### Checking Bot Status

1. **In Discord:** Check if the bot shows as "Online" in the member list
2. **Via API:** Use the health endpoint above
3. **Logs:** Check application logs for bot startup messages

## Troubleshooting

### Bot Not Starting

1. **Check environment variables:** Ensure `DISCORD_BOT_TOKEN` is set correctly
2. **Check logs:** Look for error messages in bot logs
3. **Verify token:** Make sure the Discord bot token is valid and not expired
4. **Check permissions:** Ensure the bot has necessary Discord permissions

### Bot Going Offline

1. **Check process status:** Use `pm2 status` or `ps aux | grep bot-standalone`
2. **Review logs:** Check for crash messages or errors
3. **Database connection:** Ensure database is accessible
4. **Memory limits:** Check if process is being killed due to memory constraints

### Bot Restarting Frequently

1. **Check database lock:** The bot uses a database lock to prevent duplicate instances
2. **Review lock refresh:** Check logs for lock refresh failures
3. **Database latency:** Slow database connections can cause lock issues
4. **Increase tolerance:** The bot has built-in crash recovery with 5 retry attempts

## Production Checklist

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Discord bot token valid
- [ ] Build completed successfully (`pnpm build`)
- [ ] Both processes starting correctly
- [ ] Bot showing as online in Discord
- [ ] Health check endpoint responding
- [ ] Logs being written correctly
- [ ] Auto-restart configured (PM2 or hosting platform)
- [ ] Monitoring/alerting set up (optional)

## Current Status

The bot is currently running in the **development sandbox** and will go offline when the sandbox hibernates. To ensure 24/7 uptime, deploy using one of the options above.

## Support

For issues with:
- **Manus hosting:** Visit https://help.manus.im
- **Bot functionality:** Check Discord bot logs and database connection
- **Deployment:** Review this guide and hosting platform documentation
