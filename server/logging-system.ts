/**
 * Logging System
 * Comprehensive event logging for server moderation and auditing
 */

import { Message, GuildMember, Role, User, PartialMessage, PartialGuildMember } from 'discord.js';
import { getDb } from './db';
import { serverLogs } from '../drizzle/schema';

/**
 * Log message edit event
 */
export async function logMessageEdit(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Fetch full messages if partial
    const oldMsg = oldMessage.partial ? await oldMessage.fetch() : oldMessage;
    const newMsg = newMessage.partial ? await newMessage.fetch() : newMessage;
    
    // Ignore bot messages
    if (newMsg.author?.bot) return;
    
    // Only log if content actually changed
    if (oldMsg.content === newMsg.content) return;
    
    await db.insert(serverLogs).values({
      eventType: 'message_edit',
      userId: newMsg.author?.id || null,
      username: newMsg.author?.username || 'Unknown',
      channelId: newMsg.channelId,
      channelName: newMsg.channel && 'name' in newMsg.channel ? newMsg.channel.name : 'Unknown',
      oldValue: oldMsg.content?.substring(0, 1000) || null,
      newValue: newMsg.content?.substring(0, 1000) || null,
    });
    
    console.log(`[Logging] Message edited by ${newMsg.author?.username} in ${newMsg.channel && 'name' in newMsg.channel ? newMsg.channel.name : 'Unknown'}`);
  } catch (error) {
    console.error('[Logging] Error logging message edit:', error);
  }
}

/**
 * Log message delete event
 */
export async function logMessageDelete(message: Message | PartialMessage): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Fetch full message if partial
    const msg = message.partial ? await message.fetch() : message;
    
    // Ignore bot messages
    if (msg.author?.bot) return;
    
    await db.insert(serverLogs).values({
      eventType: 'message_delete',
      userId: msg.author?.id || null,
      username: msg.author?.username || 'Unknown',
      channelId: msg.channelId,
      channelName: msg.channel && 'name' in msg.channel ? msg.channel.name : 'Unknown',
      oldValue: msg.content?.substring(0, 1000) || null,
    });
    
    console.log(`[Logging] Message deleted by ${msg.author?.username} in ${msg.channel && 'name' in msg.channel ? msg.channel.name : 'Unknown'}`);
  } catch (error) {
    console.error('[Logging] Error logging message delete:', error);
  }
}

/**
 * Log member join event
 */
export async function logMemberJoin(member: GuildMember): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(serverLogs).values({
      eventType: 'member_join',
      userId: member.id,
      username: member.user.username,
      metadata: JSON.stringify({ accountCreated: member.user.createdAt.toISOString() }),
    });
    
    console.log(`[Logging] Member joined: ${member.user.username}`);
  } catch (error) {
    console.error('[Logging] Error logging member join:', error);
  }
}

/**
 * Log member leave event
 */
export async function logMemberLeave(member: GuildMember | PartialGuildMember): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    const fullMember = member.partial ? await member.fetch() : member;
    
    await db.insert(serverLogs).values({
      eventType: 'member_leave',
      userId: fullMember.id,
      username: fullMember.user.username,
      metadata: JSON.stringify({ roles: fullMember.roles.cache.map(r => r.name) }),
    });
    
    console.log(`[Logging] Member left: ${fullMember.user.username}`);
  } catch (error) {
    console.error('[Logging] Error logging member leave:', error);
  }
}

/**
 * Log role add event
 */
export async function logRoleAdd(member: GuildMember | PartialGuildMember, role: Role): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    const fullMember = member.partial ? await member.fetch() : member;
    
    await db.insert(serverLogs).values({
      eventType: 'role_add',
      userId: fullMember.id,
      username: fullMember.user.username,
      newValue: role.name,
      metadata: JSON.stringify({ roleId: role.id }),
    });
    
    console.log(`[Logging] Role ${role.name} added to ${fullMember.user.username}`);
  } catch (error) {
    console.error('[Logging] Error logging role add:', error);
  }
}

/**
 * Log role remove event
 */
export async function logRoleRemove(member: GuildMember | PartialGuildMember, role: Role): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    const fullMember = member.partial ? await member.fetch() : member;
    
    await db.insert(serverLogs).values({
      eventType: 'role_remove',
      userId: fullMember.id,
      username: fullMember.user.username,
      oldValue: role.name,
      metadata: JSON.stringify({ roleId: role.id }),
    });
    
    console.log(`[Logging] Role ${role.name} removed from ${fullMember.user.username}`);
  } catch (error) {
    console.error('[Logging] Error logging role remove:', error);
  }
}

/**
 * Log member ban event
 */
export async function logMemberBan(userId: string, username: string, reason?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(serverLogs).values({
      eventType: 'ban',
      userId,
      username,
      reason: reason || 'No reason provided',
    });
    
    console.log(`[Logging] Member banned: ${username} - ${reason || 'No reason'}`);
  } catch (error) {
    console.error('[Logging] Error logging member ban:', error);
  }
}

/**
 * Log member unban event
 */
export async function logMemberUnban(userId: string, username: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(serverLogs).values({
      eventType: 'ban',
      userId,
      username,
      metadata: JSON.stringify({ action: 'unban' }),
    });
    
    console.log(`[Logging] Member unbanned: ${username}`);
  } catch (error) {
    console.error('[Logging] Error logging member unban:', error);
  }
}

/**
 * Log member kick event
 */
export async function logMemberKick(member: GuildMember, reason?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(serverLogs).values({
      eventType: 'kick',
      userId: member.id,
      username: member.user.username,
      reason: reason || 'No reason provided',
    });
    
    console.log(`[Logging] Member kicked: ${member.user.username} - ${reason || 'No reason'}`);
  } catch (error) {
    console.error('[Logging] Error logging member kick:', error);
  }
}

/**
 * Log nickname change event
 */
export async function logNicknameChange(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    const fullOldMember = oldMember.partial ? await oldMember.fetch() : oldMember;
    
    // Only log if nickname actually changed
    if (fullOldMember.nickname === newMember.nickname) return;
    
    await db.insert(serverLogs).values({
      eventType: 'nickname_change',
      userId: newMember.id,
      username: newMember.user.username,
      oldValue: fullOldMember.nickname || null,
      newValue: newMember.nickname || null,
    });
    
    console.log(`[Logging] Nickname changed for ${newMember.user.username}: ${fullOldMember.nickname || 'None'} → ${newMember.nickname || 'None'}`);
  } catch (error) {
    console.error('[Logging] Error logging nickname change:', error);
  }
}

/**
 * Log channel create event
 */
export async function logChannelCreate(channelId: string, channelName: string, channelType: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(serverLogs).values({
      eventType: 'channel_create',
      channelId,
      channelName,
      metadata: JSON.stringify({ channelType }),
    });
    
    console.log(`[Logging] Channel created: ${channelName} (${channelType})`);
  } catch (error) {
    console.error('[Logging] Error logging channel create:', error);
  }
}

/**
 * Log channel delete event
 */
export async function logChannelDelete(channelId: string, channelName: string, channelType: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(serverLogs).values({
      eventType: 'channel_delete',
      channelId,
      channelName,
      metadata: JSON.stringify({ channelType }),
    });
    
    console.log(`[Logging] Channel deleted: ${channelName} (${channelType})`);
  } catch (error) {
    console.error('[Logging] Error logging channel delete:', error);
  }
}
