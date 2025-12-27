# Discord Bot - Always Online Guide

## Current Status

✅ **Bot is running:** HOF 2K Manus Bot#0960  
⚠️ **Location:** Development sandbox (will go offline when sandbox hibernates)  
🎯 **Goal:** Deploy to production for 24/7 uptime

## Quick Start: Deploy to Manus (Recommended)

The **simplest and fastest** way to keep your bot online 24/7:

### Steps:

1. **Save a checkpoint** 
   - The bot deployment configuration is already set up
   - Just create a checkpoint to save the current state

2. **Click Publish**
   - Go to the Management UI (right panel)
   - Click the "Publish" button in the header
   - Your bot will automatically start on Manus production servers

3. **Verify**
   - Check Discord to see if the bot is online
   - The bot will stay online continuously

### Why Manus Hosting?

- ✅ **Zero configuration** - Everything is already set up
- ✅ **Automatic restarts** - Bot recovers from crashes automatically
- ✅ **Same infrastructure** - Runs alongside your web app
- ✅ **No extra costs** - Included with your Manus hosting
- ✅ **Built-in monitoring** - Health checks and logging included

## How It Works

When you publish, Manus will:

1. Build both the web server (`dist/index.js`) and bot (`dist/bot-standalone.js`)
2. Start both processes using the `start` script in `package.json`
3. Monitor both processes and restart them if they crash
4. Keep them running 24/7 on production servers

## Alternative: Self-Hosted Deployment

If you prefer to host on your own server, see [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:

- Using PM2 process manager
- Docker deployment
- Railway/Render deployment
- Manual server setup

## Verifying Bot Status

### In Discord
Check the member list - the bot should show as "Online" with a green dot

### Via API
```bash
curl https://your-domain.manus.space/api/bot/health
```

Expected response:
```json
{
  "status": "ok",
  "botReady": true,
  "botUsername": "HOF 2K Manus Bot#0960"
}
```

## Troubleshooting

### Bot shows offline after publishing

1. Check the bot logs in Manus dashboard
2. Verify `DISCORD_BOT_TOKEN` environment variable is set
3. Ensure the token is valid (not expired or regenerated)

### Bot keeps restarting

1. Check database connection - ensure `DATABASE_URL` is correct
2. Review bot logs for error messages
3. Verify all required environment variables are set

### Bot works in sandbox but not in production

1. Ensure all environment variables from sandbox are copied to production
2. Check that database is accessible from production environment
3. Verify Discord bot token is the same in both environments

## Environment Variables Checklist

Make sure these are set in production:

- ✅ `DISCORD_BOT_TOKEN` - Your Discord bot token
- ✅ `DATABASE_URL` - MySQL database connection string
- ✅ `JWT_SECRET` - For authentication
- ✅ `OWNER_OPEN_ID` - Bot owner ID
- ✅ All other variables from your `.env` file

## Next Steps

1. **Create a checkpoint** to save the bot deployment configuration
2. **Publish** using the Manus UI
3. **Verify** the bot is online in Discord
4. **Monitor** using the health check endpoint

That's it! Your bot will now stay online 24/7. 🚀

---

## Technical Details

### Architecture

The application uses a **dual-process architecture**:

- **Process 1:** Web server (Express + tRPC + React)
- **Process 2:** Discord bot (standalone process)

Both processes run independently but share the same database.

### Build Process

The build script compiles both processes:

```bash
pnpm build
```

This creates:
- `dist/index.js` - Web server bundle
- `dist/bot-standalone.js` - Discord bot bundle

### Start Process

The start script launches both processes:

```bash
pnpm start
# Runs: node dist/index.js & node dist/bot-standalone.js
```

The `&` operator runs them in parallel.

### Auto-Restart Logic

The bot includes built-in crash recovery:

- Catches uncaught exceptions and unhandled rejections
- Automatically restarts after crashes (up to 5 times in 5 minutes)
- Logs all restart attempts
- Prevents infinite restart loops

### Database Lock

The bot uses a database lock to prevent duplicate instances:

- Acquires lock on startup
- Refreshes lock every 30 seconds
- Releases lock on shutdown
- Handles stale locks from previous crashes

## Support

For issues with Manus hosting, visit: https://help.manus.im

For bot functionality issues, check the logs and database connection.
