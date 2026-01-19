#!/bin/bash

##############################################################################
# Scheduled Task Health Check Script
# 
# This script is called by Manus scheduled task every hour to:
# 1. Check if the bot is healthy via HTTP endpoint
# 2. Restart the bot if it's unhealthy
# 3. Send Discord notifications of status changes
#
# Works across sandbox contexts by calling HTTP endpoints instead of
# trying to access local files
##############################################################################

set -e

# Configuration
HEALTH_ENDPOINT="http://localhost:3001/health"
RESTART_ENDPOINT="http://localhost:3001/restart"
DISCORD_WEBHOOK_URL="https://discordapp.com/api/webhooks/1444709506499088467/YOUR_WEBHOOK_TOKEN"
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "NBA 2K26 Bot Health Check - $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# Check if health endpoint is accessible
echo -n "Checking bot health endpoint... "

if ! response=$(curl -s -m $TIMEOUT "$HEALTH_ENDPOINT" 2>/dev/null); then
  echo -e "${RED}FAILED${NC}"
  echo "Bot health endpoint is not responding"
  
  # Try to restart
  echo -n "Attempting to restart bot... "
  if curl -s -m $TIMEOUT -X POST "$RESTART_ENDPOINT" 2>/dev/null; then
    echo -e "${GREEN}Restart initiated${NC}"
    echo "Bot will restart within 10 seconds"
  else
    echo -e "${RED}Restart failed${NC}"
    echo "Could not reach restart endpoint"
  fi
  
  exit 1
fi

echo -e "${GREEN}OK${NC}"

# Parse health status
status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
uptime=$(echo "$response" | grep -o '"uptime":[0-9]*' | cut -d':' -f2)
discord_connected=$(echo "$response" | grep -o '"connected":[^,}]*' | head -1 | cut -d':' -f2)
db_connected=$(echo "$response" | grep -o '"connected":[^,}]*' | tail -1 | cut -d':' -f2)

echo "Status: $status"
echo "Uptime: $uptime seconds"
echo "Discord: $discord_connected"
echo "Database: $db_connected"

# Check if status is unhealthy
if [ "$status" = "unhealthy" ]; then
  echo -e "${RED}Bot is UNHEALTHY${NC}"
  
  # Trigger restart
  echo -n "Triggering restart... "
  if curl -s -m $TIMEOUT -X POST "$RESTART_ENDPOINT" 2>/dev/null; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}Failed${NC}"
  fi
  
  exit 1
fi

# Check if status is degraded
if [ "$status" = "degraded" ]; then
  echo -e "${YELLOW}Bot is DEGRADED${NC}"
  echo "Monitoring - will restart if it becomes unhealthy"
fi

# If we got here, bot is healthy or degraded
echo -e "${GREEN}Health check passed${NC}"
echo "=========================================="
exit 0
