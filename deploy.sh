#!/bin/bash

##############################################################################
# NBA 2K26 Bot Deployment Script
#
# This script automates the deployment process on DigitalOcean.
# 
# Usage:
#   ./deploy.sh              # Deploy latest code
#   ./deploy.sh --force      # Force restart even if no changes
#   ./deploy.sh --logs       # Show logs after deployment
#
# Run this from the bot directory: /opt/nba2k26-bot
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BOT_DIR="/opt/nba2k26-bot"
LOG_FILE="/var/log/nba2k26-bot/deploy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Parse arguments
FORCE_RESTART=false
SHOW_LOGS=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE_RESTART=true
      shift
      ;;
    --logs)
      SHOW_LOGS=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
  echo "[${TIMESTAMP}] INFO: $1" >> "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
  echo "[${TIMESTAMP}] SUCCESS: $1" >> "$LOG_FILE"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
  echo "[${TIMESTAMP}] ERROR: $1" >> "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
  echo "[${TIMESTAMP}] WARNING: $1" >> "$LOG_FILE"
}

# Main deployment
main() {
  log_info "Starting NBA 2K26 Bot deployment..."
  
  # Check if in correct directory
  if [ ! -f "$BOT_DIR/ecosystem.config.js" ]; then
    log_error "Not in bot directory. Expected: $BOT_DIR"
    exit 1
  fi
  
  cd "$BOT_DIR"
  
  # Step 1: Pull latest code
  log_info "Pulling latest code from GitHub..."
  if git pull origin main; then
    log_success "Code pulled successfully"
  else
    log_error "Failed to pull code"
    exit 1
  fi
  
  # Step 2: Check if there are changes
  CHANGES=$(git diff HEAD@{1} --stat 2>/dev/null | wc -l)
  if [ "$CHANGES" -eq 0 ] && [ "$FORCE_RESTART" = false ]; then
    log_warning "No code changes detected. Skipping deployment."
    exit 0
  fi
  
  # Step 3: Install dependencies
  log_info "Installing dependencies..."
  if npm install; then
    log_success "Dependencies installed"
  else
    log_error "Failed to install dependencies"
    exit 1
  fi
  
  # Step 4: Build
  log_info "Building bot..."
  if npm run build; then
    log_success "Build completed"
  else
    log_error "Build failed"
    exit 1
  fi
  
  # Step 5: Restart with PM2
  log_info "Restarting bot with PM2..."
  if pm2 restart ecosystem.config.js --env production; then
    log_success "Bot restarted successfully"
  else
    log_error "Failed to restart bot"
    exit 1
  fi
  
  # Step 6: Wait for bot to start
  log_info "Waiting for bot to initialize..."
  sleep 5
  
  # Step 7: Verify bot is running
  if pm2 status | grep -q "online"; then
    log_success "Bot is running"
  else
    log_error "Bot failed to start"
    pm2 logs nba2k26-bot --lines 50
    exit 1
  fi
  
  # Step 8: Verify health endpoint
  log_info "Checking health endpoint..."
  if curl -s http://localhost:3001/health > /dev/null; then
    log_success "Health endpoint responding"
  else
    log_warning "Health endpoint not responding yet (may still be initializing)"
  fi
  
  log_success "Deployment completed successfully!"
  
  # Show logs if requested
  if [ "$SHOW_LOGS" = true ]; then
    log_info "Showing recent logs..."
    pm2 logs nba2k26-bot --lines 50
  fi
}

# Error handler
trap 'log_error "Deployment failed!"; exit 1' ERR

# Run main function
main

exit 0
