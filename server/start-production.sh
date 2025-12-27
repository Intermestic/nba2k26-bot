#!/bin/bash

# Production startup script that ensures both web server and bot stay running
# This script starts both processes and monitors them for crashes

LOG_DIR="logs"
mkdir -p "$LOG_DIR"

WEB_LOG="$LOG_DIR/web.log"
BOT_LOG="$LOG_DIR/bot.log"

echo "Starting production services..."

# Function to start web server
start_web() {
    echo "[$(date)] Starting web server..." | tee -a "$WEB_LOG"
    NODE_ENV=production node dist/index.js >> "$WEB_LOG" 2>&1 &
    WEB_PID=$!
    echo "[$(date)] Web server started with PID $WEB_PID" | tee -a "$WEB_LOG"
}

# Function to start bot
start_bot() {
    echo "[$(date)] Starting Discord bot..." | tee -a "$BOT_LOG"
    NODE_ENV=production node dist/bot-standalone.js >> "$BOT_LOG" 2>&1 &
    BOT_PID=$!
    echo "[$(date)] Discord bot started with PID $BOT_PID" | tee -a "$BOT_LOG"
}

# Start both services
start_web
start_bot

# Monitor processes and restart if they crash
while true; do
    sleep 30
    
    # Check web server
    if ! kill -0 $WEB_PID 2>/dev/null; then
        echo "[$(date)] Web server crashed! Restarting..." | tee -a "$WEB_LOG"
        start_web
    fi
    
    # Check bot
    if ! kill -0 $BOT_PID 2>/dev/null; then
        echo "[$(date)] Discord bot crashed! Restarting..." | tee -a "$BOT_LOG"
        start_bot
    fi
done
