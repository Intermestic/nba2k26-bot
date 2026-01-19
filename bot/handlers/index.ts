/**
 * Event Handlers Index
 * 
 * Sets up all Discord event handlers in a modular way.
 * Each handler is in its own file for maintainability.
 */

import { Client, Events } from 'discord.js';
import { logger } from '../services/logger';
import { handleReactionAdd } from './reactionAdd';
import { handleReactionRemove } from './reactionRemove';
import { handleMessageCreate } from './messageCreate';
import { handleInteraction } from './interactionCreate';

/**
 * Set up all event handlers on the Discord client
 */
export function setupEventHandlers(client: Client): void {
  logger.info('Setting up event handlers...');

  // Slash command interactions
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      // Only handle chat input commands (slash commands)
      if (!interaction.isChatInputCommand()) return;
      
      await handleInteraction(interaction, client);
    } catch (error) {
      logger.error('Error handling interaction:', error);
    }
  });

  // Message reactions (for voting and bid processing)
  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      await handleReactionAdd(reaction, user);
    } catch (error) {
      logger.error('Error handling reaction add:', error);
    }
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    try {
      await handleReactionRemove(reaction, user);
    } catch (error) {
      logger.error('Error handling reaction remove:', error);
    }
  });

  // New messages (for FA bids and text commands - parallel support)
  client.on('messageCreate', async (message) => {
    try {
      await handleMessageCreate(message);
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  });

  logger.info('✅ Event handlers configured (including slash commands)');
}
