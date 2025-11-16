/**
 * Custom Command Handler
 * Processes user-created custom commands with variables and cooldowns
 */

import { Client, Message, EmbedBuilder } from 'discord.js';
import { getDb } from './db';
import { customCommands, commandCooldowns } from '../drizzle/schema';
import { eq, and, gt, sql } from 'drizzle-orm';

/**
 * Replace variables in command response
 */
function replaceVariables(text: string, message: Message): string {
  const guild = message.guild;
  const user = message.author;
  const channel = message.channel;
  
  return text
    .replace(/\{user\}/gi, `<@${user.id}>`)
    .replace(/\{username\}/gi, user.username)
    .replace(/\{channel\}/gi, `<#${channel.id}>`)
    .replace(/\{server\}/gi, guild?.name || 'Server')
    .replace(/\{memberCount\}/gi, guild?.memberCount?.toString() || '0');
}

/**
 * Check if command is on cooldown
 */
async function isOnCooldown(
  commandId: number,
  userId: string,
  channelId: string,
  cooldownType: 'user' | 'channel' | 'global'
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const now = new Date();
  
  let query;
  if (cooldownType === 'user') {
    query = db.select().from(commandCooldowns)
      .where(and(
        eq(commandCooldowns.commandId, commandId),
        eq(commandCooldowns.userId, userId),
        gt(commandCooldowns.expiresAt, now)
      ));
  } else if (cooldownType === 'channel') {
    query = db.select().from(commandCooldowns)
      .where(and(
        eq(commandCooldowns.commandId, commandId),
        eq(commandCooldowns.channelId, channelId),
        gt(commandCooldowns.expiresAt, now)
      ));
  } else {
    // global
    query = db.select().from(commandCooldowns)
      .where(and(
        eq(commandCooldowns.commandId, commandId),
        gt(commandCooldowns.expiresAt, now)
      ));
  }
  
  const result = await query;
  return result.length > 0;
}

/**
 * Set cooldown for command
 */
async function setCooldown(
  commandId: number,
  userId: string,
  channelId: string,
  cooldownType: 'user' | 'channel' | 'global',
  cooldownSeconds: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const expiresAt = new Date(Date.now() + cooldownSeconds * 1000);
  
  await db.insert(commandCooldowns).values({
    commandId,
    userId: cooldownType === 'user' ? userId : null,
    channelId: cooldownType === 'channel' ? channelId : null,
    expiresAt,
  });
}

/**
 * Check if user has required permissions
 */
async function hasPermission(
  message: Message,
  permissionLevel: 'everyone' | 'role' | 'admin',
  requiredRoleIds?: string
): Promise<boolean> {
  if (permissionLevel === 'everyone') return true;
  
  if (permissionLevel === 'admin') {
    return message.member?.permissions.has('Administrator') || false;
  }
  
  if (permissionLevel === 'role' && requiredRoleIds) {
    try {
      const roleIds = JSON.parse(requiredRoleIds);
      if (!Array.isArray(roleIds)) return false;
      
      const memberRoles = message.member?.roles.cache.map(r => r.id) || [];
      return roleIds.some(roleId => memberRoles.includes(roleId));
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Handle custom command execution
 */
export async function handleCustomCommand(message: Message): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const content = message.content.trim();
  
  // Get all enabled commands
  const commands = await db.select().from(customCommands)
    .where(eq(customCommands.enabled, true));
  
  // Find matching command
  const command = commands.find(cmd => 
    content.toLowerCase().startsWith(cmd.trigger.toLowerCase())
  );
  
  if (!command) return false;
  
  // Check permissions
  const hasPerms = await hasPermission(
    message,
    command.permissionLevel,
    command.requiredRoleIds || undefined
  );
  
  if (!hasPerms) {
    await message.reply('❌ You do not have permission to use this command.');
    return true;
  }
  
  // Check cooldown
  if (command.cooldownSeconds > 0) {
    const onCooldown = await isOnCooldown(
      command.id,
      message.author.id,
      message.channelId,
      command.cooldownType
    );
    
    if (onCooldown) {
      await message.reply(`⏰ This command is on cooldown. Please wait before using it again.`);
      return true;
    }
  }
  
  // Process response based on type
  try {
    const responseText = replaceVariables(command.response, message);
    
    if (command.responseType === 'text') {
      await message.reply(responseText);
    } else if (command.responseType === 'embed') {
      const embed = new EmbedBuilder()
        .setDescription(responseText)
        .setColor(parseInt(command.embedColor?.replace('#', '') || '5865F2', 16));
      
      if (command.embedTitle) {
        embed.setTitle(replaceVariables(command.embedTitle, message));
      }
      
      await message.reply({ embeds: [embed] });
    } else if (command.responseType === 'reaction') {
      // For reaction type, the response should be an emoji
      await message.react(responseText);
    }
    
    // Set cooldown
    if (command.cooldownSeconds > 0) {
      await setCooldown(
        command.id,
        message.author.id,
        message.channelId,
        command.cooldownType,
        command.cooldownSeconds
      );
    }
    
    // Increment use count (don't await to avoid blocking)
    db.update(customCommands)
      .set({ useCount: (command.useCount || 0) + 1 })
      .where(eq(customCommands.id, command.id))
      .catch(err => console.error('[Custom Commands] Failed to increment use count:', err));
    
    return true;
  } catch (error) {
    console.error('[Custom Commands] Error executing command:', error);
    await message.reply('❌ Failed to execute command.');
    return true;
  }
}

/**
 * Clean up expired cooldowns (run periodically)
 */
export async function cleanupExpiredCooldowns(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  
  try {
    await db.delete(commandCooldowns)
      .where(sql`${commandCooldowns.expiresAt} < ${now.toISOString()}`);
    
    console.log('[Custom Commands] Cleaned up expired cooldowns');
  } catch (error) {
    console.error('[Custom Commands] Failed to clean up cooldowns:', error);
  }
}
