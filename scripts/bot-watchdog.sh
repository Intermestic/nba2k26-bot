#!/bin/bash

# Bot Watchdog Script
# This script monitors and restarts the Discord bot if it crashes
# It also handles scheduled restarts at 3 AM EST

PROJECT_DIR="/home/ubuntu/nba2k26-database"
LOG_DIR="$PROJECT_DIR/logs"
BOT_LOG="$LOG_DIR/bot.log"
BOT_ERROR_LOG="$LOG_DIR/bot-error.log"
WATCHDOG_LOG="$LOG_DIR/watchdog.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$WATCHDOG_LOG"
}

# Function to check if bot is running
is_bot_running() {
    pgrep -f "bot-standalone" > /dev/null
    return $?
}

# Function to start the bot
start_bot() {
    log "Starting Discord bot..."
    cd "$PROJECT_DIR"
    
    # Kill any existing bot processes first
    pkill -f "bot-standalone"
    sleep 2
    
    # Start bot in background
    nohup pnpm run start:bot >> "$BOT_LOG" 2>> "$BOT_ERROR_LOG" &
    
    sleep 3
    
    if is_bot_running; then
        log "Bot started successfully (PID: $(pgrep -f 'bot-standalone'))"
        return 0
    else
        log "ERROR: Bot failed to start"
        return 1
    fi
}

# Function to perform scheduled restart at 3 AM
check_scheduled_restart() {
    current_hour=$(date '+%H')
    current_minute=$(date '+%M')
    
    # Check if it's 3:00 AM (EST is handled by system timezone)
    if [ "$current_hour" = "03" ] && [ "$current_minute" = "00" ]; then
        log "Scheduled restart time reached (3:00 AM)"
        return 0
    fi
    
    return 1
}

log "=== Bot Watchdog Started ==="
log "Monitoring bot process and scheduling 3 AM restarts"

# Initial bot start
if ! is_bot_running; then
    log "Bot not running, starting..."
    start_bot
else
    log "Bot already running (PID: $(pgrep -f 'bot-standalone'))"
fi

# Main monitoring loop
last_restart_day=""
while true; do
    # Check for scheduled restart
    if check_scheduled_restart; then
        current_day=$(date '+%Y-%m-%d')
        
        # Only restart once per day at 3 AM
        if [ "$last_restart_day" != "$current_day" ]; then
            log "Performing scheduled 3 AM restart..."
            start_bot
            last_restart_day="$current_day"
        fi
    fi
    
    # Check if bot is still running
    if ! is_bot_running; then
        log "WARNING: Bot process died unexpectedly, restarting..."
        start_bot
        
        # If restart fails, wait before trying again
        if [ $? -ne 0 ]; then
            log "Restart failed, waiting 30 seconds before retry..."
            sleep 30
        fi
    fi
    
    # Check every 60 seconds
    sleep 60
done
