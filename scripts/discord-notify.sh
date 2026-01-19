#!/bin/bash

# Discord Webhook Notification Helper
# Sends formatted messages to a Discord channel via webhook
# Usage: ./discord-notify.sh "Title" "Message" "color" "emoji"

WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"
CHANNEL_ID="1444709506499088467"

# Function to send Discord webhook message
send_discord_notification() {
    local title="$1"
    local message="$2"
    local color="${3:-3447003}"  # Default blue
    local emoji="${4:-📢}"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # If webhook URL is not set, try to get it from the bot's config
    if [ -z "$WEBHOOK_URL" ]; then
        # Fallback: use Discord API directly with bot token
        DISCORD_TOKEN="${DISCORD_BOT_TOKEN}"
        
        if [ -z "$DISCORD_TOKEN" ]; then
            echo "[ERROR] No Discord webhook or bot token configured"
            return 1
        fi
        
        # Send message via Discord API
        curl -s -X POST \
            "https://discord.com/api/v10/channels/$CHANNEL_ID/messages" \
            -H "Authorization: Bot $DISCORD_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"embeds\": [{
                    \"title\": \"$emoji $title\",
                    \"description\": \"$message\",
                    \"color\": $color,
                    \"timestamp\": \"$timestamp\",
                    \"footer\": {
                        \"text\": \"NBA 2K26 Bot Monitor\"
                    }
                }]
            }" > /dev/null 2>&1
        
        return $?
    else
        # Send via webhook
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"embeds\": [{
                    \"title\": \"$emoji $title\",
                    \"description\": \"$message\",
                    \"color\": $color,
                    \"timestamp\": \"$timestamp\",
                    \"footer\": {
                        \"text\": \"NBA 2K26 Bot Monitor\"
                    }
                }]
            }" > /dev/null 2>&1
        
        return $?
    fi
}

# Parse arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <title> <message> [color] [emoji]"
    echo "Example: $0 'Bot Started' 'Bot has been restarted' '65280' '✅'"
    exit 1
fi

send_discord_notification "$@"
