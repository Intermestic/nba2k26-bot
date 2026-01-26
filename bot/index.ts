/**
 * NBA 2K26 Discord Bot - Clean Architecture Rebuild
 * 
 * This bot handles:
 * - Trade voting and approval processing
 * - FA bidding with admin-gated workflow
 * - Player roster management
 * 
 * Architecture:
 * - bot/index.ts - Main entry point and client setup
 * - bot/handlers/ - Event handlers (reactions, messages)
 * - bot/parsers/ - Trade and FA parsing logic
 * - bot/services/ - Database and external service integrations
 * - bot/utils/ - Utility functions and helpers
 */

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { logger } from './services/logger';
import { DatabaseService } from './services/database';
import { HealthService } from './services/health';
import { HealthReporter } from './services/healthReporter';
import { StartupScanner } from './services/startupScanner';
import { initCapStatusUpdater } from './services/capStatusUpdater';
import { initializeAwardVoting } from './services/awardVoting';
import { setupEventHandlers } from './handlers';
import { config } from './config';

// Bot client instance
let client: Client | null = null;

/**
 * Initialize and start the Discord bot
 */
export async function startBot(): Promise<Client> {
  logger.info('🚀 Starting NBA 2K26 Discord Bot...');
  
  // Create Discord client with required intents
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction,
    ],
  });

  // Initialize database connection
  try {
    await DatabaseService.initialize();
    logger.info('✅ Database connection established');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    // Continue anyway - graceful degradation
  }

  // Set up event handlers
  setupEventHandlers(client);

  // Handle client ready event
  client.once('ready', async () => {
    logger.info(`✅ Bot logged in as ${client?.user?.tag}`);
    logger.info(`📊 Watching ${client?.guilds.cache.size} servers`);
    
    // Start HOFSN webhook server
    try {
      const { startHOFSNServer } = await import('./services/hofsnServer');
      startHOFSNServer(client);
      logger.info('✅ HOFSN webhook server started');
    } catch (error) {
      logger.error('Failed to start HOFSN server:', error);
    }
    
    // Initialize health monitoring
    if (client) {
      HealthService.initialize(client);
      // Initialize health reporter (reports to admin channel every hour)
      HealthReporter.initialize(client, 60);
    }
    
    // Initialize cap status updater
    if (client) {
      initCapStatusUpdater(client);
      logger.info('✅ Cap status updater initialized');
    }
    
    // Initialize award voting service
    if (client) {
      const awardVotingService = initializeAwardVoting(client);
      await awardVotingService.initialize();
      logger.info('✅ Award voting service initialized');
    }
    
    // Run startup scan for missed votes/bids
    if (client) {
      await StartupScanner.initialize(client);
      
      // Update cap status after startup scan completes
      try {
        const { getCapStatusUpdater } = await import('./services/capStatusUpdater');
        const capUpdater = getCapStatusUpdater();
        if (capUpdater) {
          await capUpdater.updateAll(client);
          logger.info('✅ Cap status updated after startup scan');
        }
      } catch (error) {
        logger.error('Error updating cap status after startup scan:', error);
      }
    }
  });

  // Handle errors gracefully
  client.on('error', (error) => {
    logger.error('Discord client error:', error);
    HealthService.recordError(`Discord error: ${error.message}`);
  });

  // Handle disconnection and reconnection
  client.on('shardDisconnect', (event, shardId) => {
    logger.warn(`Shard ${shardId} disconnected:`, event);
    HealthService.recordError(`Shard ${shardId} disconnected`);
  });

  client.on('shardReconnecting', (shardId) => {
    logger.info(`Shard ${shardId} reconnecting...`);
  });

  client.on('shardResume', (shardId) => {
    logger.info(`Shard ${shardId} resumed`);
    HealthService.clearErrors(); // Clear errors on successful reconnect
  });

  // Login to Discord
  const token = config.discordToken;
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN is not set');
  }

  await client.login(token);
  
  return client;
}

/**
 * Gracefully stop the bot
 */
export async function stopBot(): Promise<void> {
  logger.info('🛑 Stopping bot...');
  
  // Stop health monitoring
  HealthService.stop();
  
  if (client) {
    client.destroy();
    client = null;
  }
  
  await DatabaseService.close();
  logger.info('✅ Bot stopped');
}

/**
 * Get the current bot client instance
 */
export function getClient(): Client | null {
  return client;
}

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal');
  await stopBot();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal');
  await stopBot();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  HealthService.recordError(`Uncaught exception: ${error.message}`);
  // Don't exit - try to keep running
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  HealthService.recordError(`Unhandled rejection: ${String(reason)}`);
  // Don't exit - try to keep running
});

// Auto-start when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting bot from direct execution...');
  startBot().catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
  });
}
