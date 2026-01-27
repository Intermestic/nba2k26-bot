#!/bin/bash
# NBA 2K26 Bot - DigitalOcean Deployment Script
# Run this script ON YOUR DIGITALOCEAN DROPLET after cloning the repository

set -e  # Exit on error

echo "🚀 NBA 2K26 Bot - DigitalOcean Deployment"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (use: sudo bash deploy-to-digitalocean.sh)"
  exit 1
fi

# Get droplet IP
DROPLET_IP=$(curl -s ifconfig.me)
echo "📍 Droplet IP: $DROPLET_IP"
echo ""

# Step 1: Update system
echo "📦 Step 1/8: Updating system packages..."
apt update && apt upgrade -y

# Step 2: Install Node.js 22
echo "📦 Step 2/8: Installing Node.js 22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
fi
echo "✅ Node.js version: $(node --version)"

# Step 3: Install pnpm
echo "📦 Step 3/8: Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
echo "✅ pnpm version: $(pnpm --version)"

# Step 4: Install tsx
echo "📦 Step 4/8: Installing tsx..."
pnpm add -g tsx

# Step 5: Install PM2
echo "📦 Step 5/8: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo "✅ PM2 version: $(pm2 --version)"

# Step 6: Install dependencies
echo "📦 Step 6/8: Installing bot dependencies..."
cd /opt/nba2k26-bot
pnpm install

# Step 7: Create log directory
echo "📁 Step 7/8: Creating log directory..."
mkdir -p /var/log/nba2k26-bot
chmod 755 /var/log/nba2k26-bot

# Step 8: Check for .env file
echo "🔐 Step 8/8: Checking environment configuration..."
if [ ! -f "/opt/nba2k26-bot/.env" ]; then
    echo ""
    echo "⚠️  WARNING: .env file not found!"
    echo ""
    echo "Please create /opt/nba2k26-bot/.env with your environment variables."
    echo "You can use .env.production.template as a reference:"
    echo ""
    echo "  nano /opt/nba2k26-bot/.env"
    echo ""
    echo "After creating .env, run this script again or start the bot manually:"
    echo "  pm2 start bot/index.ts --name nba2k26-bot --interpreter npx --interpreter-args tsx"
    echo ""
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Start bot with PM2
echo "🚀 Starting bot with PM2..."
pm2 delete nba2k26-bot 2>/dev/null || true  # Delete if exists
pm2 start bot/index.ts \
  --name nba2k26-bot \
  --interpreter npx \
  --interpreter-args tsx \
  --max-memory-restart 500M \
  --restart-delay 5000 \
  --max-restarts 10 \
  --min-uptime 10000

# Save PM2 configuration
pm2 save

# Setup PM2 startup
echo ""
echo "🔧 Setting up PM2 auto-start..."
pm2 startup systemd -u root --hp /root
pm2 save

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Bot Status:"
pm2 status

echo ""
echo "🌐 Webhook URL:"
echo "   http://$DROPLET_IP:3002/article"
echo ""
echo "   Update this URL in your HOFSN configuration!"
echo ""

echo "📝 Useful Commands:"
echo "   pm2 status                  - Check bot status"
echo "   pm2 logs nba2k26-bot        - View live logs"
echo "   pm2 restart nba2k26-bot     - Restart bot"
echo "   pm2 monit                   - Monitor resources"
echo ""

echo "🔍 Test webhook:"
echo "   curl http://localhost:3002/health"
echo ""

echo "🎉 Bot is now running 24/7!"
