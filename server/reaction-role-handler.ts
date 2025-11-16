/**
 * Reaction Role Handler
 * Manages reaction-based role assignment/removal
 */

import { Client, MessageReaction, User, EmbedBuilder, TextChannel, PartialMessageReaction, PartialUser } from 'discord.js';
import { getDb } from './db';
import { reactionRolePanels, reactionRoles } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Post or update reaction role panel in Discord
 */
export async function postReactionRolePanel(client: Client, panelId: number): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };
  
  try {
    // Get panel and roles
    const panel = await db.select().from(reactionRolePanels).where(eq(reactionRolePanels.id, panelId));
    if (panel.length === 0) {
      return { success: false, message: "Panel not found" };
    }
    
    const panelData = panel[0];
    const roles = await db.select().from(reactionRoles).where(eq(reactionRoles.panelId, panelId));
    
    if (roles.length === 0) {
      return { success: false, message: "No roles configured for this panel" };
    }
    
    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(panelData.title)
      .setColor(parseInt(panelData.embedColor?.replace('#', '') || '5865F2', 16));
    
    if (panelData.description) {
      embed.setDescription(panelData.description);
    }
    
    // Add role fields
    const roleList = roles.map(role => {
      let line = `${role.emoji} - **${role.roleName}**`;
      if (role.description) {
        line += ` - ${role.description}`;
      }
      return line;
    }).join('\n');
    
    embed.addFields({ name: 'React to get a role:', value: roleList });
    
    if (panelData.maxRoles > 0) {
      embed.setFooter({ text: `Maximum ${panelData.maxRoles} role(s) per user` });
    }
    
    // Get channel
    const channel = await client.channels.fetch(panelData.channelId);
    if (!channel || !channel.isTextBased()) {
      return { success: false, message: "Channel not found or not text-based" };
    }
    
    // Post or update message
    let message;
    if (panelData.messageId) {
      try {
        // Try to update existing message
        message = await (channel as TextChannel).messages.fetch(panelData.messageId);
        await message.edit({ embeds: [embed] });
      } catch {
        // Message not found, create new one
        message = await (channel as TextChannel).send({ embeds: [embed] });
        await db.update(reactionRolePanels)
          .set({ messageId: message.id })
          .where(eq(reactionRolePanels.id, panelId));
      }
    } else {
      // Create new message
      message = await (channel as TextChannel).send({ embeds: [embed] });
      await db.update(reactionRolePanels)
        .set({ messageId: message.id })
        .where(eq(reactionRolePanels.id, panelId));
    }
    
    // Add reactions
    for (const role of roles) {
      try {
        await message.react(role.emoji);
      } catch (error) {
        console.error(`[Reaction Roles] Failed to add reaction ${role.emoji}:`, error);
      }
    }
    
    console.log(`[Reaction Roles] Posted panel ${panelData.name} to channel ${panelData.channelId}`);
    return { success: true, message: "Panel posted successfully" };
  } catch (error) {
    console.error('[Reaction Roles] Error posting panel:', error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Handle reaction add event
 */
export async function handleReactionAdd(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Fetch full reaction and user if partial
    if (reaction.partial) {
      reaction = await reaction.fetch();
    }
    if (user.partial) {
      user = await user.fetch();
    }
    
    // Ignore bot reactions
    if (user.bot) return;
    
    // Check if this message is a reaction role panel
    const panels = await db.select().from(reactionRolePanels)
      .where(and(
        eq(reactionRolePanels.messageId, reaction.message.id),
        eq(reactionRolePanels.enabled, true)
      ));
    
    if (panels.length === 0) return;
    
    const panel = panels[0];
    
    // Find matching role
    const roles = await db.select().from(reactionRoles)
      .where(eq(reactionRoles.panelId, panel.id));
    
    const matchingRole = roles.find(r => r.emoji === reaction.emoji.toString() || r.emoji === reaction.emoji.name);
    
    if (!matchingRole) return;
    
    // Get guild member
    const guild = reaction.message.guild;
    if (!guild) return;
    
    const member = await guild.members.fetch(user.id);
    if (!member) return;
    
    // Check max roles limit
    if (panel.maxRoles > 0) {
      const currentRoles = roles.filter(r => member.roles.cache.has(r.roleId));
      if (currentRoles.length >= panel.maxRoles && !member.roles.cache.has(matchingRole.roleId)) {
        // Remove reaction if limit reached
        await reaction.users.remove(user.id);
        try {
          await member.send(`❌ You can only have ${panel.maxRoles} role(s) from the **${panel.name}** panel.`);
        } catch {
          // User has DMs disabled
        }
        return;
      }
    }
    
    // Check required roles
    if (matchingRole.requiredRoleIds) {
      try {
        const requiredIds = JSON.parse(matchingRole.requiredRoleIds);
        if (Array.isArray(requiredIds) && requiredIds.length > 0) {
          const hasRequired = requiredIds.some(roleId => member.roles.cache.has(roleId));
          if (!hasRequired) {
            await reaction.users.remove(user.id);
            try {
              await member.send(`❌ You need a required role to get **${matchingRole.roleName}**.`);
            } catch {
              // User has DMs disabled
            }
            return;
          }
        }
      } catch (error) {
        console.error('[Reaction Roles] Error parsing required role IDs:', error);
      }
    }
    
    // Add role
    try {
      const role = await guild.roles.fetch(matchingRole.roleId);
      if (role) {
        await member.roles.add(role);
        console.log(`[Reaction Roles] Added role ${role.name} to ${user.tag}`);
      }
    } catch (error) {
      console.error('[Reaction Roles] Error adding role:', error);
      await reaction.users.remove(user.id);
    }
  } catch (error) {
    console.error('[Reaction Roles] Error handling reaction add:', error);
  }
}

/**
 * Handle reaction remove event
 */
export async function handleReactionRemove(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Fetch full reaction and user if partial
    if (reaction.partial) {
      reaction = await reaction.fetch();
    }
    if (user.partial) {
      user = await user.fetch();
    }
    
    // Ignore bot reactions
    if (user.bot) return;
    
    // Check if this message is a reaction role panel
    const panels = await db.select().from(reactionRolePanels)
      .where(and(
        eq(reactionRolePanels.messageId, reaction.message.id),
        eq(reactionRolePanels.enabled, true)
      ));
    
    if (panels.length === 0) return;
    
    const panel = panels[0];
    
    // Find matching role
    const roles = await db.select().from(reactionRoles)
      .where(eq(reactionRoles.panelId, panel.id));
    
    const matchingRole = roles.find(r => r.emoji === reaction.emoji.toString() || r.emoji === reaction.emoji.name);
    
    if (!matchingRole) return;
    
    // Get guild member
    const guild = reaction.message.guild;
    if (!guild) return;
    
    const member = await guild.members.fetch(user.id);
    if (!member) return;
    
    // Remove role
    try {
      const role = await guild.roles.fetch(matchingRole.roleId);
      if (role) {
        await member.roles.remove(role);
        console.log(`[Reaction Roles] Removed role ${role.name} from ${user.tag}`);
      }
    } catch (error) {
      console.error('[Reaction Roles] Error removing role:', error);
    }
  } catch (error) {
    console.error('[Reaction Roles] Error handling reaction remove:', error);
  }
}
