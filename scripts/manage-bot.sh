#!/bin/bash

# Discord Bot Management Script
# Ensures only one bot instance is running at a time

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill all bot instances
kill_all_bots() {
    echo -e "${YELLOW}Killing all existing bot instances...${NC}"
    pkill -f "bot-standalone" || true
    sleep 2
    
    # Force kill if still running
    if pgrep -f "bot-standalone" > /dev/null; then
        echo -e "${YELLOW}Force killing remaining bot processes...${NC}"
        pkill -9 -f "bot-standalone" || true
        sleep 1
    fi
    
    echo -e "${GREEN}All bot instances stopped${NC}"
}

# Function to start bot with PM2
start_bot() {
    echo -e "${YELLOW}Starting bot with PM2...${NC}"
    
    # Stop PM2 bot if running
    pnpm pm2 stop nba2k26-bot 2>/dev/null || true
    pnpm pm2 delete nba2k26-bot 2>/dev/null || true
    
    # Start bot
    pnpm pm2 start ecosystem.config.cjs --only nba2k26-bot
    
    echo -e "${GREEN}Bot started successfully${NC}"
    echo -e "${YELLOW}View logs with: pnpm pm2 logs nba2k26-bot${NC}"
}

# Function to check bot status
check_status() {
    echo -e "${YELLOW}Checking bot status...${NC}"
    
    # Check for running processes
    if pgrep -f "bot-standalone" > /dev/null; then
        echo -e "${GREEN}Bot processes found:${NC}"
        ps aux | grep "bot-standalone" | grep -v grep
    else
        echo -e "${RED}No bot processes running${NC}"
    fi
    
    # Check PM2 status
    echo -e "\n${YELLOW}PM2 Status:${NC}"
    pnpm pm2 list | grep nba2k26-bot || echo -e "${RED}Bot not in PM2${NC}"
}

# Function to restart bot cleanly
restart_bot() {
    echo -e "${YELLOW}Restarting bot...${NC}"
    kill_all_bots
    start_bot
}

# Main command handler
case "${1:-}" in
    start)
        kill_all_bots
        start_bot
        ;;
    stop)
        kill_all_bots
        pnpm pm2 stop nba2k26-bot 2>/dev/null || true
        ;;
    restart)
        restart_bot
        ;;
    status)
        check_status
        ;;
    logs)
        pnpm pm2 logs nba2k26-bot
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Kill all bot instances and start fresh with PM2"
        echo "  stop    - Stop all bot instances"
        echo "  restart - Restart the bot cleanly"
        echo "  status  - Check bot status"
        echo "  logs    - View bot logs"
        exit 1
        ;;
esac
