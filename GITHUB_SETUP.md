# GitHub Setup for DigitalOcean Deployment

This guide explains how to set up GitHub for deploying your bot to DigitalOcean.

## Why GitHub?

GitHub acts as a bridge between your Manus development environment and your DigitalOcean production server. When you update code in Manus, you push to GitHub, then pull on the Droplet.

## Step 1: Create GitHub Repository

### Option A: Create New Repository on GitHub.com

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `nba2k26-bot`
3. **Description:** "NBA 2K26 Discord Bot - Production Deployment"
4. **Visibility:** Private (recommended for security)
5. **Initialize:** Don't add README, .gitignore, or license (we'll use existing)
6. Click **Create repository**

### Option B: Use Manus GitHub Export

If your Manus project has GitHub integration:
1. Go to Manus Management UI → Settings → GitHub
2. Click **Export to GitHub**
3. Select your GitHub account and repository name
4. Click **Export**

## Step 2: Configure Git in Your Local/Manus Environment

### Add GitHub Remote to Your Project

```bash
cd /home/ubuntu/nba2k26-database

# Add GitHub as remote
git remote add github https://github.com/YOUR_USERNAME/nba2k26-bot.git

# Verify remotes
git remote -v
# Should show:
# origin   ... (Manus)
# github   https://github.com/YOUR_USERNAME/nba2k26-bot.git
```

### Push Code to GitHub

```bash
cd /home/ubuntu/nba2k26-database

# Push main branch
git branch -M main
git push -u github main

# Verify on GitHub.com - you should see your code
```

## Step 3: Create SSH Key for Droplet → GitHub Access

This allows your Droplet to pull code from GitHub without entering passwords.

### On Your Droplet

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "nba2k26-bot@droplet" -f /root/.ssh/github_key -N ""

# Display public key
cat /root/.ssh/github_key.pub
```

### Add Public Key to GitHub

1. Go to [github.com/settings/keys](https://github.com/settings/keys)
2. Click **New SSH key**
3. **Title:** `NBA 2K26 Bot Droplet`
4. **Key type:** Authentication Key
5. **Key:** Paste the output from `cat /root/.ssh/github_key.pub`
6. Click **Add SSH key**

### Configure SSH on Droplet

```bash
# Create SSH config
cat >> /root/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile /root/.ssh/github_key
    AddKeysToAgent yes
EOF

# Set permissions
chmod 600 /root/.ssh/config

# Test connection
ssh -T git@github.com
# Should output: "Hi YOUR_USERNAME! You've successfully authenticated..."
```

## Step 4: Clone Repository on Droplet

```bash
cd /opt/nba2k26-bot
git clone git@github.com:YOUR_USERNAME/nba2k26-bot.git .

# Verify
git remote -v
# Should show: origin  git@github.com:YOUR_USERNAME/nba2k26-bot.git
```

## Step 5: Daily Workflow

### When You Update Code in Manus

```bash
# 1. In Manus environment
cd /home/ubuntu/nba2k26-database
git add .
git commit -m "Update: [your changes]"
git push github main

# 2. On your Droplet (SSH in)
cd /opt/nba2k26-bot
git pull origin main
npm install
npm run build
pm2 restart nba2k26-bot

# Or use the deploy script:
./deploy.sh
```

## Step 6: Protect Main Branch (Optional but Recommended)

This prevents accidental pushes that break production.

1. Go to your GitHub repository
2. Settings → Branches
3. Click **Add rule**
4. **Branch name pattern:** `main`
5. Check:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
6. Click **Create**

## Step 7: Set Up Branch Protection Secrets (Optional)

For sensitive data like Discord tokens:

1. Go to repository Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Add secrets (they won't be visible in code):
   - `DISCORD_BOT_TOKEN`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - etc.

## Troubleshooting

### "Permission denied (publickey)"

```bash
# Verify SSH key is loaded
ssh-add /root/.ssh/github_key

# Test connection again
ssh -T git@github.com
```

### "Repository not found"

```bash
# Check remote URL
git remote -v

# If wrong, update it
git remote set-url origin git@github.com:YOUR_USERNAME/nba2k26-bot.git
```

### "fatal: could not read Username"

Use SSH instead of HTTPS:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/nba2k26-bot.git
```

## Quick Reference

| Task | Command |
|------|---------|
| Push to GitHub | `git push github main` |
| Pull on Droplet | `git pull origin main` |
| Check remote | `git remote -v` |
| Deploy | `./deploy.sh` |
| View logs | `pm2 logs nba2k26-bot` |

---

**Next:** Follow the main [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) guide to complete your setup.
