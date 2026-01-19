/**
 * Slash Command Registration Script
 * 
 * Run this script once to register slash commands with Discord.
 * Commands are registered globally (available in all servers).
 * 
 * Usage: npx tsx bot/commands/register.ts
 * 
 * Note: Global commands can take up to 1 hour to propagate.
 * For faster testing, use guild-specific registration.
 */

import { REST, Routes } from 'discord.js';
import { commandsJSON } from './index';
import { config } from '../config';

const GUILD_ID = '1087524540634116112'; // HoF server ID for faster testing

async function registerCommands() {
  const token = config.discord.token;
  
  if (!token) {
    console.error('❌ DISCORD_BOT_TOKEN not set');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('🔄 Registering slash commands...');
    console.log(`📋 Commands to register: ${commandsJSON.map(c => c.name).join(', ')}`);

    // Get application ID from token
    const applicationId = Buffer.from(token.split('.')[0], 'base64').toString();
    
    // Register commands globally (takes up to 1 hour to propagate)
    // For faster testing, use guild-specific registration below
    
    const useGuildCommands = process.argv.includes('--guild');
    
    if (useGuildCommands) {
      // Guild-specific registration (instant)
      console.log(`📍 Registering to guild ${GUILD_ID} (instant)...`);
      await rest.put(
        Routes.applicationGuildCommands(applicationId, GUILD_ID),
        { body: commandsJSON }
      );
      console.log('✅ Guild commands registered successfully!');
    } else {
      // Global registration (up to 1 hour)
      console.log('🌐 Registering globally (may take up to 1 hour)...');
      await rest.put(
        Routes.applicationCommands(applicationId),
        { body: commandsJSON }
      );
      console.log('✅ Global commands registered successfully!');
    }

    console.log('\n📝 Registered commands:');
    commandsJSON.forEach(cmd => {
      console.log(`  /${cmd.name} - ${cmd.description}`);
    });

  } catch (error) {
    console.error('❌ Failed to register commands:', error);
    process.exit(1);
  }
}

registerCommands();
