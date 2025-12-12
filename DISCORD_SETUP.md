# Discord Integration Setup Guide

This guide explains how to set up the Discord webhook integration for auto-updating team cap status.

## Features

- **Auto-updating embed** showing all teams' cap status
- **Color-coded indicators**: 🔴 Over cap, 🟡 At cap, 🟢 Under cap
- **Clickable team links** that take you directly to filtered team view on the website
- **Manual refresh** to update the Discord message with latest data

## Setup Instructions

### 1. Create a Discord Webhook

1. Go to your Discord server settings
2. Navigate to **Integrations** → **Webhooks**
3. Click **"New Webhook"**
4. Give it a name (e.g., "Cap Status Bot")
5. Select the channel where you want the cap status posted
6. Click **"Copy Webhook URL"**

**⚠️ Keep this URL secret!** Anyone with this URL can post to your Discord channel.

### 2. Configure the Integration

1. Log in to the NBA 2K26 Database as an admin
2. Navigate to **Admin** → **Discord** (or visit `/admin/discord`)
3. Paste your webhook URL in the **"Discord Webhook URL"** field
4. Verify the **"Website URL"** is correct (defaults to your current site URL)
5. Click **"Post New Message"**

### 3. Get the Message ID (for updates)

1. In Discord, find the message that was just posted
2. Right-click the message → **"Copy Message ID"**
   - If you don't see this option, enable **Developer Mode** in Discord settings:
     - User Settings → Advanced → Developer Mode (toggle ON)
3. Paste the Message ID in the **"Message ID"** field on the Discord integration page
4. Click **"Update Existing"** to refresh the same message

## Usage

### Posting a New Message

Use **"Post New Message"** when:
- Setting up for the first time
- You want to create a new cap status message
- The old message was deleted

### Updating an Existing Message

Use **"Update Existing"** when:
- You want to refresh the data in an existing message
- You want to keep your Discord channel clean (recommended)
- You have the message ID from a previous post

**💡 Tip:** Always use "Update Existing" after the initial post to avoid cluttering your Discord channel with multiple cap status messages.

## What the Embed Shows

The Discord embed displays:

- **Header**: "🏀 NBA 2K26 Team Cap Status"
- **Cap limit**: 1098 Total Overall
- **Summary**: Count of teams over cap, at cap, and under cap
- **Team cards** (for each team):
  - Team name and player count (e.g., "Bucks (14/14)")
  - Total overall with status indicator
  - Over-cap amount if applicable (e.g., "🔴 1106 (+8)")
  - Clickable "View Team →" link
- **Footer**: Last updated timestamp

## Color Coding

- 🔴 **Red**: Team is over the 1098 cap limit
- 🟡 **Yellow**: Team is exactly at the 1098 cap limit
- 🟢 **Green**: Team is under the 1098 cap limit

## Auto-Update Feature

The system includes built-in automatic updates that trigger whenever team assignments change.

### Enabling Auto-Update

1. Go to the Discord integration page (`/admin/discord`)
2. Configure your webhook URL, message ID, and website URL
3. Toggle **"Auto-Update"** to ON
4. Click **"Save Configuration"**

### How It Works

- Automatically updates Discord message when players are assigned to teams
- Rate limited to max 1 update per minute (prevents spam)
- Runs in the background without blocking team assignments
- Logs errors to server console if update fails

### When Auto-Update Triggers

- Player assigned to a new team via "Assign Team" button
- Bulk team assignments via bulk transactions
- Any team change that affects cap status

**Note:** Auto-update requires both a webhook URL and message ID to be configured. The message must have been posted by the same webhook.

## Troubleshooting

### "Failed to post" error

- Verify your webhook URL is correct
- Check that the webhook hasn't been deleted in Discord
- Ensure you have admin permissions on the website

### "Invalid Discord webhook URL" error

- Make sure the URL starts with `https://discord.com/api/webhooks/`
- Check for any extra spaces or characters in the URL

### Links don't work

- Verify the "Website URL" field is set to your actual website URL
- Make sure the URL doesn't have a trailing slash

### Message doesn't update

- Confirm you're using the correct message ID
- The message must have been posted by the same webhook
- The message can't be older than 14 days (Discord limitation)

### Auto-update not working

- Verify auto-update is enabled in the configuration
- Check that both webhook URL and message ID are saved
- Ensure the message ID is correct and the message exists
- Check server logs for error messages
- Verify rate limiting isn't blocking updates (max 1 per minute)

## API Endpoints

The Discord integration uses these tRPC endpoints:

- `discord.postCapStatus` - Post a new cap status message
- `discord.updateCapStatus` - Update an existing message

Both endpoints require admin authentication.

## Security Notes

- **Never share your webhook URL publicly**
- Store the webhook URL securely (use environment variables if automating)
- Regularly rotate webhook URLs if compromised
- Only admins can access the Discord integration page
- All API calls require admin authentication

## Support

For issues or questions, contact your system administrator or refer to the main project documentation.
