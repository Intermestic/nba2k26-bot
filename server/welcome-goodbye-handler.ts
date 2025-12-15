/**
 * Welcome & Goodbye Message Handler
 * Handles member join/leave events with customizable messages and auto-roles
 */

import { Client, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { getDb } from './db';
import { welcomeConfig, goodbyeConfig } from '../drizzle/schema';

/**
 * Replace variables in message content
 */
function replaceVariables(text: string, member: GuildMember): string {
  const guild = member.guild;
  
  return text
    .replace(/\{user\}/gi, `<@${member.id}>`)
    .replace(/\{username\}/gi, member.user.username)
    .replace(/\{server\}/gi, guild.name)
    .replace(/\{memberCount\}/gi, guild.memberCount.toString());
}

/**
 * Handle member join event
 */
export async function handleMemberJoin(member: GuildMember): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Get welcome config
    const config = await db.select().from(welcomeConfig).limit(1);
    if (config.length === 0 || !config[0].enabled) return;
    
    const welcomeCfg = config[0];
    
    // Send welcome message to channel
    try {
      const channel = await member.guild.channels.fetch(welcomeCfg.channelId);
      if (!channel || !channel.isTextBased()) {
        console.error('[Welcome] Channel not found or not text-based:', welcomeCfg.channelId);
        return;
      }
      
      const messageContent = replaceVariables(welcomeCfg.messageContent, member);
      
      if (welcomeCfg.messageType === 'text') {
        await (channel as TextChannel).send(messageContent);
      } else if (welcomeCfg.messageType === 'embed') {
        const embed = new EmbedBuilder()
          .setDescription(messageContent)
          .setColor(parseInt(welcomeCfg.embedColor?.replace('#', '') || '5865F2', 16))
          .setTimestamp();
        
        if (welcomeCfg.embedTitle) {
          embed.setTitle(replaceVariables(welcomeCfg.embedTitle, member));
        }
        
        if (welcomeCfg.embedImageUrl) {
          embed.setImage(welcomeCfg.embedImageUrl);
        }
        
        // Add member avatar as thumbnail
        embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }));
        
        await (channel as TextChannel).send({ embeds: [embed] });
      } else if (welcomeCfg.messageType === 'card') {
        // Card type - rich embed with member info
        const embed = new EmbedBuilder()
          .setTitle(`Welcome to ${member.guild.name}!`)
          .setDescription(messageContent)
          .setColor(parseInt(welcomeCfg.embedColor?.replace('#', '') || '5865F2', 16))
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: 'Member', value: `<@${member.id}>`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true }
          )
          .setTimestamp();
        
        if (welcomeCfg.embedImageUrl) {
          embed.setImage(welcomeCfg.embedImageUrl);
        }
        
        await (channel as TextChannel).send({ embeds: [embed] });
      }
      
      console.log(`[Welcome] Sent welcome message for ${member.user.tag}`);
    } catch (error) {
      console.error('[Welcome] Error sending welcome message:', error);
    }
    
    // Send DM if enabled
    if (welcomeCfg.dmEnabled && welcomeCfg.dmContent) {
      try {
        const dmContent = replaceVariables(welcomeCfg.dmContent, member);
        await member.send(dmContent);
        console.log(`[Welcome] Sent DM to ${member.user.tag}`);
      } catch (error) {
        console.error('[Welcome] Error sending DM:', error);
      }
    }
    
    // Assign auto-roles
    if (welcomeCfg.autoRoleIds) {
      try {
        const roleIds = JSON.parse(welcomeCfg.autoRoleIds);
        if (Array.isArray(roleIds) && roleIds.length > 0) {
          for (const roleId of roleIds) {
            try {
              const role = await member.guild.roles.fetch(roleId);
              if (role) {
                await member.roles.add(role);
                console.log(`[Welcome] Assigned role ${role.name} to ${member.user.tag}`);
              }
            } catch (roleError) {
              console.error(`[Welcome] Error assigning role ${roleId}:`, roleError);
            }
          }
        }
      } catch (error) {
        console.error('[Welcome] Error parsing auto-role IDs:', error);
      }
    }
  } catch (error) {
    console.error('[Welcome] Error handling member join:', error);
  }
}

/**
 * Handle member leave event
 */
export async function handleMemberLeave(member: GuildMember): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Get goodbye config
    const config = await db.select().from(goodbyeConfig).limit(1);
    if (config.length === 0 || !config[0].enabled) return;
    
    const goodbyeCfg = config[0];
    
    // Send goodbye message to channel
    try {
      const channel = await member.guild.channels.fetch(goodbyeCfg.channelId);
      if (!channel || !channel.isTextBased()) {
        console.error('[Goodbye] Channel not found or not text-based:', goodbyeCfg.channelId);
        return;
      }
      
      const messageContent = replaceVariables(goodbyeCfg.messageContent, member);
      
      if (goodbyeCfg.messageType === 'text') {
        await (channel as TextChannel).send(messageContent);
      } else if (goodbyeCfg.messageType === 'embed') {
        const embed = new EmbedBuilder()
          .setDescription(messageContent)
          .setColor(parseInt(goodbyeCfg.embedColor?.replace('#', '') || 'ED4245', 16))
          .setTimestamp();
        
        if (goodbyeCfg.embedTitle) {
          embed.setTitle(replaceVariables(goodbyeCfg.embedTitle, member));
        }
        
        // Add member avatar as thumbnail
        embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }));
        
        await (channel as TextChannel).send({ embeds: [embed] });
      }
      
      console.log(`[Goodbye] Sent goodbye message for ${member.user.tag}`);
    } catch (error) {
      console.error('[Goodbye] Error sending goodbye message:', error);
    }
  } catch (error) {
    console.error('[Goodbye] Error handling member leave:', error);
  }
}
