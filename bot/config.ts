/**
 * Bot Configuration
 * 
 * All configuration values are loaded from environment variables
 * with sensible defaults where applicable.
 */

export const config = {
  // Discord
  discordToken: process.env.DISCORD_BOT_TOKEN || '',
  
  // Discord object (for compatibility with slash commands)
  discord: {
    token: process.env.DISCORD_BOT_TOKEN || '',
  },
  
  // Channel IDs
  channels: {
    trades: process.env.TRADE_CHANNEL_ID || '1087524540634116116',
    freeAgency: process.env.FA_CHANNEL_ID || '1095812920056762510',
    tradeLog: process.env.TRADE_LOG_CHANNEL_ID || '1087524540634116116',
  },
  
  // Admin user ID (for gated operations)
  adminUserId: '679275787664359435',
  
  // Admins object (for compatibility with slash commands)
  admins: {
    ownerId: '679275787664359435',
  },
  
  // Voting thresholds
  voting: {
    approvalThreshold: 7,  // Votes needed to approve a trade
    rejectionThreshold: 5, // Votes needed to reject a trade
  },
  
  // Emojis
  emojis: {
    upvote: '👍',
    downvote: '👎',
    bidConfirm: '❗',      // Admin confirms bid is counted
    bidProcess: '⚡',      // Admin processes winning bid
    tradeReverse: '⏪',    // Reverse a trade
    success: '✅',
    error: '❌',
  },
  
  // Database
  database: {
    connectionString: process.env.DATABASE_URL || '',
    poolSize: 10,
    connectionTimeout: 30000,
  },
  
  // Message filtering
  filters: {
    // Ignore messages before this ID (for historical cleanup)
    minTradeMessageId: process.env.MIN_TRADE_MESSAGE_ID || '1451093939145674763',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    includeTimestamp: true,
  },
};

// Validate required configuration
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.discordToken) {
    errors.push('DISCORD_BOT_TOKEN is required');
  }
  
  if (!config.database.connectionString) {
    errors.push('DATABASE_URL is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
