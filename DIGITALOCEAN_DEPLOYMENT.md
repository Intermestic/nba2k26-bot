# DigitalOcean Deployment Guide - NBA 2K26 Discord Bot

This guide walks you through deploying the bot to a DigitalOcean Droplet for 24/7 production operation.

## Table of Contents
1. [DigitalOcean Setup](#digitalocean-setup)
2. [Droplet Configuration](#droplet-configuration)
3. [Bot Deployment](#bot-deployment)
4. [Auto-Restart Setup](#auto-restart-setup)
5. [Monitoring & Logs](#monitoring--logs)
6. [Updating the Bot](#updating-the-bot)

---

## DigitalOcean Setup

### Step 1: Create DigitalOcean Account
1. Go to [digitalocean.com](https://www.digitalocean.com)
2. Sign up with email
3. Add payment method (credit card)
4. Create a new project named "NBA 2K26 Bot"

### Step 2: Create a Droplet
1. Click **Create** → **Droplets**
2. **Choose Image:** Ubuntu 22.04 (LTS)
3. **Choose Size:** Basic ($6/month - 1GB RAM, 1 vCPU, 25GB SSD)
4. **Region:** Choose closest to your location
5. **Authentication:** Add SSH key (recommended) or password
6. **Hostname:** `nba2k26-bot`
7. Click **Create Droplet**

**Wait 2-3 minutes for the Droplet to boot.**

---

## Droplet Configuration

### Step 3: Connect to Your Droplet

**Via SSH (recommended):**
```bash
ssh root@YOUR_DROPLET_IP
```

**Via DigitalOcean Console:**
- Click on your Droplet
- Click **Console** tab
- Click **Launch Droplet Console**

### Step 4: Update System
```bash
apt update && apt upgrade -y
```

### Step 5: Install Node.js and npm
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x
```

### Step 6: Install PM2 (Process Manager)
```bash
npm install -g pm2
pm2 --version
```

### Step 7: Install Git
```bash
apt install -y git
```

### Step 8: Create Bot Directory
```bash
mkdir -p /opt/nba2k26-bot
cd /opt/nba2k26-bot
```

---

## Bot Deployment

### Step 9: Clone Your Bot Repository

First, you need to push your bot code to GitHub:

**On your local machine (or in Manus):**
```bash
cd /home/ubuntu/nba2k26-database
git remote add github https://github.com/YOUR_USERNAME/nba2k26-bot.git
git branch -M main
git push -u github main
```

**On the Droplet:**
```bash
cd /opt/nba2k26-bot
git clone https://github.com/YOUR_USERNAME/nba2k26-bot.git .
```

### Step 10: Install Dependencies
```bash
cd /opt/nba2k26-bot
npm install
```

### Step 11: Set Up Environment Variables

Create `.env` file with your secrets:
```bash
cat > /opt/nba2k26-bot/.env << 'EOF'
DISCORD_BOT_TOKEN=your_bot_token_here
DATABASE_URL=mysql://user:password@localhost:3306/nba2k26
JWT_SECRET=your_jwt_secret_here
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=your_name
VITE_APP_TITLE=NBA 2K26 Bot
VITE_APP_LOGO=logo_url
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
EOF
```

**Important:** Replace all `your_*` values with actual credentials from your Manus project.

### Step 12: Build the Bot
```bash
cd /opt/nba2k26-bot
npm run build
```

---

## Auto-Restart Setup

### Step 13: Create PM2 Ecosystem File

Create `ecosystem.config.js` in the bot directory:

```bash
cat > /opt/nba2k26-bot/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'nba2k26-bot',
      script: './dist/bot/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      // Auto restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      // Logging
      error_file: '/var/log/nba2k26-bot/error.log',
      out_file: '/var/log/nba2k26-bot/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
    }
  ]
};
EOF
```

### Step 14: Create Log Directory
```bash
mkdir -p /var/log/nba2k26-bot
chmod 755 /var/log/nba2k26-bot
```

### Step 15: Start Bot with PM2
```bash
cd /opt/nba2k26-bot
pm2 start ecosystem.config.js
pm2 status
pm2 logs nba2k26-bot
```

### Step 16: Enable PM2 Auto-Start on Reboot
```bash
pm2 startup
# Copy and run the command it outputs
pm2 save
```

---

## Monitoring & Logs

### View Bot Status
```bash
pm2 status
pm2 monit  # Real-time monitoring dashboard
```

### View Logs
```bash
# Last 100 lines
pm2 logs nba2k26-bot --lines 100

# Follow logs in real-time
pm2 logs nba2k26-bot

# View error logs
tail -f /var/log/nba2k26-bot/error.log
```

### Restart Bot
```bash
pm2 restart nba2k26-bot
```

### Stop Bot
```bash
pm2 stop nba2k26-bot
```

---

## Updating the Bot

### When You Update Code in Manus

**Step 1: Push changes to GitHub**
```bash
cd /home/ubuntu/nba2k26-database
git add .
git commit -m "Update bot features"
git push github main
```

**Step 2: On the Droplet, pull and redeploy**
```bash
cd /opt/nba2k26-bot
git pull origin main
npm install
npm run build
pm2 restart nba2k26-bot
```

**Or use the automated deploy script (see below):**
```bash
./deploy.sh
```

---

## Automated Deployment Script

Create `deploy.sh` in the bot directory:

```bash
cat > /opt/nba2k26-bot/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying NBA 2K26 Bot..."

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building bot..."
npm run build

# Restart with PM2
echo "♻️  Restarting bot..."
pm2 restart nba2k26-bot

# Show status
echo "✅ Deployment complete!"
pm2 status
EOF

chmod +x /opt/nba2k26-bot/deploy.sh
```

Now you can deploy with:
```bash
cd /opt/nba2k26-bot
./deploy.sh
```

---

## Troubleshooting

### Bot Not Starting
```bash
# Check PM2 logs
pm2 logs nba2k26-bot

# Check if port 3001 is in use
lsof -i :3001

# Manually test the bot
cd /opt/nba2k26-bot
node dist/bot/index.js
```

### Database Connection Issues
```bash
# Test MySQL connection
mysql -h localhost -u user -p -e "SELECT 1"

# Check DATABASE_URL in .env
cat /opt/nba2k26-bot/.env | grep DATABASE_URL
```

### Out of Memory
```bash
# Check memory usage
free -h

# Increase PM2 memory limit in ecosystem.config.js
# max_memory_restart: '1G'
```

### View Full Bot Output
```bash
pm2 logs nba2k26-bot --lines 500 --raw
```

---

## Monitoring Dashboard (Optional)

### Set Up PM2 Plus (Free Tier)
```bash
pm2 plus
# Follow the link to create account and connect
```

This gives you:
- Web dashboard
- Email alerts on crashes
- Performance monitoring
- Log aggregation

---

## Backup & Recovery

### Backup Bot Directory
```bash
tar -czf /root/nba2k26-bot-backup-$(date +%Y%m%d).tar.gz /opt/nba2k26-bot
```

### Backup Database
```bash
mysqldump -u user -p nba2k26 > /root/nba2k26-db-backup-$(date +%Y%m%d).sql
```

---

## Cost Breakdown

| Item | Cost |
|------|------|
| DigitalOcean Droplet (1GB, 1 vCPU) | $6/month |
| Database (included in Droplet) | $0 |
| **Total** | **$6/month** |

---

## Next Steps

1. ✅ Create DigitalOcean account
2. ✅ Create Droplet (Ubuntu 22.04, $6/month)
3. ✅ Follow Steps 3-16 above
4. ✅ Test bot is running: `pm2 status`
5. ✅ Keep Manus project for development
6. ✅ Deploy updates using `./deploy.sh`

**Your bot is now running 24/7!** 🎉

---

## Support

For issues:
- Check logs: `pm2 logs nba2k26-bot`
- Restart: `pm2 restart nba2k26-bot`
- SSH into Droplet and debug manually
- Check DigitalOcean status page for outages
