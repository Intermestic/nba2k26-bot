#!/bin/bash
# Bot Startup Script for Manus Sandbox
# This script starts the Discord bot using PM2 for automatic restart on crashes
# Run this script after sandbox resets or when the bot needs to be restarted

set -e

echo "🚀 Starting NBA 2K26 Discord Bot..."
echo ""

# Change to project directory
cd /home/ubuntu/nba2k26-database

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. Installing PM2..."
    pnpm add -g pm2
    echo "✅ PM2 installed"
fi

# Stop any existing bot processes
echo "🛑 Stopping existing bot processes..."
pkill -f "bot/index.ts" 2>/dev/null || true
pm2 delete nba2k-bot 2>/dev/null || true
sleep 2

# Start bot with PM2
echo "▶️  Starting bot with PM2..."
pm2 start bot/index.ts \
  --name nba2k-bot \
  --interpreter npx \
  --interpreter-args tsx \
  --max-memory-restart 500M \
  --restart-delay 5000 \
  --max-restarts 10 \
  --min-uptime 10000

# Save PM2 process list
pm2 save

echo ""
echo "✅ Bot started successfully!"
echo ""
echo "📊 Bot Status:"
pm2 status

echo ""
echo "📝 Useful Commands:"
echo "  pm2 status          - Check bot status"
echo "  pm2 logs nba2k-bot  - View bot logs (Ctrl+C to exit)"
echo "  pm2 restart nba2k-bot - Restart bot"
echo "  pm2 stop nba2k-bot  - Stop bot"
echo "  pm2 monit           - Monitor bot resources"
echo ""
