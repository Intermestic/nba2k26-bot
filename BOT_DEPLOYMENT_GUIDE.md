# NBA 2K26 Discord Bot - Deployment Guide

This document provides comprehensive instructions for deploying, configuring, and maintaining the NBA 2K26 Discord Bot.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Slash Commands](#slash-commands)
6. [Text Commands (Legacy)](#text-commands-legacy)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The NBA 2K26 Discord Bot is a clean, modular bot that handles trade voting and free agent bidding for the Hall of Fame Basketball Association league. It features automatic trade processing, player roster management, and comprehensive health monitoring.

### Key Features

| Feature | Description |
|---------|-------------|
| Trade Voting | Automatic vote counting with 👍/👎 reactions |
| Trade Processing | Moves players between teams when trades are approved |
| FA Bidding | Admin-gated workflow for free agent signings |
| Slash Commands | Modern Discord slash commands with autocomplete |
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
├── index.ts              # Main entry point, client setup, graceful shutdown
├── config.ts             # Centralized configuration
├── commands/             # Slash command definitions
│   ├── index.ts          # Command definitions
│   └── register.ts       # Command registration script
├── handlers/             # Discord event handlers
│   ├── index.ts          # Event handler setup
│   ├── interactionCreate.ts # Slash command handler
│   ├── reactionAdd.ts    # Handles reaction additions
│   ├── reactionRemove.ts # Handles reaction removals
│   └── messageCreate.ts  # Handles new messages & text commands
├── parsers/              # Message parsing logic
│   ├── tradeParser.ts    # Parses trade messages
│   ├── faBidParser.ts    # Parses FA bid messages
│   └── playerMatcher.ts  # Fuzzy player name matching
└── services/             # Business logic services
    ├── database.ts       # Database connection pool
    ├── logger.ts         # Logging service
    ├── health.ts         # Health monitoring
    ├── startupScanner.ts # Missed vote recovery
    ├── tradeVoting.ts    # Trade vote processing
    └── faBidding.ts      # FA bid processing
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

# Register slash commands (one-time setup)
pnpm register-commands

# Start the bot
pnpm bot
```

### Registering Slash Commands

Slash commands must be registered with Discord before they appear in the command picker.

```bash
# Register globally (takes up to 1 hour to propagate)
pnpm register-commands

# Register to a specific guild (instant, for testing)
pnpm register-commands:guild
```

**Note:** Global commands can take up to 1 hour to appear in Discord. Guild-specific commands appear instantly but require the bot to have `applications.commands` scope in that guild.

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
- Use Slash Commands

**OAuth2 Scopes:**
- `bot`
- `applications.commands`

---

## Slash Commands

The bot supports modern Discord slash commands. Type `/` in any channel to see available commands.

### Available Commands

| Command | Description | Access |
|---------|-------------|--------|
| `/check-trade` | Check vote status on a trade message | Everyone |
| `/reverse-trade` | Reverse a processed trade | Admin only |
| `/bot-status` | View bot health, uptime, and connection info | Everyone |
| `/help` | Show all available commands and usage tips | Everyone |
| `/force-process` | Force approve or reject a trade | Admin only |

### Command Details

#### `/check-trade`
Check the current vote status on a trade message.

**Options:**
- `message_id` (optional) - The message ID of the trade. Right-click the message → Copy ID.

**Example:**
```
/check-trade message_id:1234567890123456789
```

**Response:**
Shows an embed with:
- Current upvote count vs threshold
- Current downvote count vs threshold
- Status (Pending/Approved/Rejected)

---

#### `/reverse-trade`
Reverse a processed trade, moving all players back to their original teams.

**Options:**
- `message_id` (required) - The message ID of the trade to reverse.

**Access:** Admin only

**Example:**
```
/reverse-trade message_id:1234567890123456789
```

---

#### `/bot-status`
View the bot's current health status.

**Response:**
Shows an embed with:
- Overall status (Healthy/Degraded/Unhealthy)
- Uptime
- Discord connection status and latency
- Database connection status
- Number of servers
- Recent errors (if any)

---

#### `/help`
Display all available commands and usage tips.

**Response:**
Shows an embed with:
- All available commands and descriptions
- Voting thresholds
- Tips for using reactions and commands

---

#### `/force-process`
Force approve or reject a trade regardless of vote count.

**Options:**
- `message_id` (required) - The message ID of the trade
- `action` (required) - Choose "Approve" or "Reject"

**Access:** Admin only

**Example:**
```
/force-process message_id:1234567890123456789 action:Approve
```

---

## Text Commands (Legacy)

Text commands are still supported for backward compatibility. They run in parallel with slash commands.

### Available Text Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `!check-trade` | Check vote status | Reply to a trade message |
| `!reverse-trade` | Reverse a trade | Reply to a trade message (admin only) |

### Trade Voting

Trades are automatically processed when they reach the voting threshold.

**How it works:**
1. A trade message is posted in the trade channel
2. Users react with 👍 (approve) or 👎 (reject)
3. When 7 upvotes are reached, the trade is automatically processed
4. When 5 downvotes are reached, the trade is rejected

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
| Slash commands not showing | Not registered or still propagating | Run `pnpm register-commands` and wait up to 1 hour |
| Database errors | Connection string wrong | Verify `DATABASE_URL` |
| Health endpoint unavailable | Port conflict | Change `HEALTH_PORT` |
| Trades not processing | Channel ID wrong | Update `config.ts` |
| Player not found | Name mismatch | Check fuzzy matching logs |
| "Missing Access" on registration | Bot lacks permissions | Re-invite bot with `applications.commands` scope |

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

### Re-registering Slash Commands

If slash commands aren't appearing or are outdated:

```bash
# Re-register globally
pnpm register-commands

# Wait up to 1 hour for propagation
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
| `bot/commands/index.ts` | Slash command definitions |
| `bot/commands/register.ts` | Command registration script |
| `bot/handlers/interactionCreate.ts` | Slash command handler |
| `bot/services/tradeVoting.ts` | Trade vote processing |
| `bot/services/faBidding.ts` | FA bid processing |
| `bot/parsers/tradeParser.ts` | Trade message parsing |
| `bot/parsers/playerMatcher.ts` | Player name fuzzy matching |
| `PARSING_AND_PROCESSING_KNOWLEDGE.md` | Detailed parsing documentation |

---

## Support

For issues or questions, check the logs first, then review this documentation. The bot is designed to be self-healing and will recover from most transient issues automatically.
