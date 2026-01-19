# NBA 2K26 Discord Bot - Deployment Guide

This document provides comprehensive instructions for deploying, configuring, and maintaining the NBA 2K26 Discord Bot.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Commands & Usage](#commands--usage)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The NBA 2K26 Discord Bot is a clean, modular bot that handles trade voting and free agent bidding for the Hall of Fame Basketball Association league. It features automatic trade processing, player roster management, and comprehensive health monitoring.

### Key Features

| Feature | Description |
|---------|-------------|
| Trade Voting | Automatic vote counting with 👍/👎 reactions |
| Trade Processing | Moves players between teams when trades are approved |
| FA Bidding | Admin-gated workflow for free agent signings |
| Startup Scanner | Catches up on missed votes during downtime |
| Health Monitoring | HTTP endpoint + heartbeat logging |
| Graceful Degradation | Continues operating even if database is temporarily unavailable |

### Voting Thresholds

| Action | Threshold |
|--------|-----------|
| Trade Approval | 7 upvotes (👍) |
| Trade Rejection | 5 downvotes (👎) |

---

## Architecture

```
bot/
├── index.ts           # Main entry point, client setup, graceful shutdown
├── config.ts          # Centralized configuration
├── handlers/          # Discord event handlers
│   ├── index.ts       # Event handler setup
│   ├── reactionAdd.ts # Handles reaction additions
│   ├── reactionRemove.ts # Handles reaction removals
│   └── messageCreate.ts  # Handles new messages
├── parsers/           # Message parsing logic
│   ├── tradeParser.ts # Parses trade messages
│   ├── faBidParser.ts # Parses FA bid messages
│   └── playerMatcher.ts # Fuzzy player name matching
└── services/          # Business logic services
    ├── database.ts    # Database connection pool
    ├── logger.ts      # Logging service
    ├── health.ts      # Health monitoring
    ├── startupScanner.ts # Missed vote recovery
    ├── tradeVoting.ts # Trade vote processing
    └── faBidding.ts   # FA bid processing
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes | Discord bot authentication token |
| `DATABASE_URL` | Yes | MySQL/TiDB connection string |
| `HEALTH_PORT` | No | Port for health endpoint (default: 3001) |

### Channel Configuration

Edit `bot/config.ts` to update channel IDs:

```typescript
channels: {
  trades: '1087524540634116116',    // Trade voting channel
  freeAgents: '1095812920056762510', // FA bidding channel
}
```

### Admin Configuration

```typescript
admins: {
  ownerId: '679275787664359435', // Primary admin user ID
}
```

---

## Deployment

### Prerequisites

1. Node.js 18+ installed
2. pnpm package manager
3. Discord bot token with required permissions
4. MySQL/TiDB database connection

### Installation

```bash
# Clone repository
cd /home/ubuntu/nba2k26-database

# Install dependencies
pnpm install

# Start the bot
pnpm bot
```

### Running as a Background Service

```bash
# Start in background with nohup
nohup pnpm bot > bot.log 2>&1 &

# Or use the start script
node start-bot.mjs
```

### Required Discord Bot Permissions

The bot requires these intents and permissions:

**Intents:**
- Guilds
- GuildMessages
- GuildMessageReactions
- MessageContent
- GuildMembers

**Permissions:**
- Read Messages/View Channels
- Send Messages
- Add Reactions
- Read Message History

---

## Commands & Usage

### Trade Voting

Trades are automatically processed when they reach the voting threshold.

**How it works:**
1. A trade message is posted in the trade channel
2. Users react with 👍 (approve) or 👎 (reject)
3. When 7 upvotes are reached, the trade is automatically processed
4. When 5 downvotes are reached, the trade is rejected

**Admin Commands:**
- `!check-trade` - Reply to a trade message to see current vote count
- `!reverse-trade` - Reply to a processed trade to reverse it (admin only)

**Trade Reversal:**
- React with ⏪ to reverse a processed trade (admin only)

### FA Bidding

FA bids use an admin-gated workflow for safety.

**How it works:**
1. User posts a bid message (e.g., "Sign Player Name Bid 5")
2. Admin reacts with ❗ to confirm the bid is valid
3. Admin reacts with ⚡ to process the winning bid

---

## Monitoring

### Health Endpoint

The bot exposes an HTTP health endpoint on port 3001.

**Endpoints:**

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Full health status JSON |
| `GET /ready` | Readiness check (200 if ready, 503 if not) |

**Example Response:**

```json
{
  "status": "healthy",
  "uptime": 3600,
  "discord": {
    "connected": true,
    "latency": 150,
    "guilds": 1
  },
  "database": {
    "connected": true
  },
  "lastCheck": "2026-01-19T04:15:06.397Z",
  "errors": []
}
```

**Status Values:**
- `healthy` - All systems operational
- `degraded` - Some issues but bot is functional
- `unhealthy` - Critical issues, bot may not be functional

### Heartbeat Logging

The bot logs a heartbeat every 30 seconds showing current status:

```
💓 Heartbeat: healthy | Discord: connected | DB: connected | Uptime: 1h 30m
```

### Startup Scanner

On startup, the bot scans the last 100 trade messages to catch up on any missed votes during downtime. This ensures no trades are lost.

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Bot not responding | Token invalid or expired | Check `DISCORD_BOT_TOKEN` |
| Database errors | Connection string wrong | Verify `DATABASE_URL` |
| Health endpoint unavailable | Port conflict | Change `HEALTH_PORT` |
| Trades not processing | Channel ID wrong | Update `config.ts` |
| Player not found | Name mismatch | Check fuzzy matching logs |

### Checking Logs

```bash
# View recent logs
tail -100 bot.log

# Search for errors
grep -i error bot.log

# Watch live logs
tail -f bot.log
```

### Restarting the Bot

```bash
# Find and kill existing process
pkill -f "tsx bot/index.ts"

# Start fresh
pnpm bot
```

### Database Connection Issues

If the database is temporarily unavailable, the bot will:
1. Continue running (graceful degradation)
2. Log warnings about database issues
3. Attempt to reconnect automatically
4. Skip database operations until connection is restored

### Discord Connection Issues

If Discord connection is lost:
1. The bot will automatically attempt to reconnect
2. Shard reconnection events are logged
3. Health status will show `unhealthy` until reconnected

---

## File Reference

| File | Purpose |
|------|---------|
| `bot/index.ts` | Main entry point |
| `bot/config.ts` | Configuration settings |
| `bot/services/tradeVoting.ts` | Trade vote processing |
| `bot/services/faBidding.ts` | FA bid processing |
| `bot/parsers/tradeParser.ts` | Trade message parsing |
| `bot/parsers/playerMatcher.ts` | Player name fuzzy matching |
| `PARSING_AND_PROCESSING_KNOWLEDGE.md` | Detailed parsing documentation |

---

## Support

For issues or questions, check the logs first, then review this documentation. The bot is designed to be self-healing and will recover from most transient issues automatically.
