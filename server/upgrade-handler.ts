import { Message } from 'discord.js';
import { parseUpgradeRequest } from './upgrade-parser';
import { validateUpgradeRequest, formatValidationMessage } from './upgrade-validator';
import { getDb } from './db';
import { upgradeRequests, players, teamAssignments } from '../drizzle/schema';
import { findPlayerByFuzzyName } from './trade-parser';

const UPGRADE_LOG_CHANNEL_ID = process.env.UPGRADE_LOG_CHANNEL_ID || '1149106208498790500';

/**
 * Handle upgrade request message from team channel
 */
export async function handleUpgradeRequest(message: Message, teamName: string) {
  console.log(`[Upgrade Handler] Processing message in ${teamName} channel`);
  
  const text = message.content.trim();
  
  // Check if message contains upgrade keywords
  if (!text.match(/upgrade|badge|bronze|silver|gold/i)) {
    return; // Not an upgrade request
  }
  
  // Parse the upgrade request
  const parsed = await parseUpgradeRequest(text);
  
  if (!parsed) {
    console.log('[Upgrade Handler] Could not parse upgrade request');
    return; // Not a valid upgrade format
  }
  
  console.log('[Upgrade Handler] Parsed upgrade:', parsed);
  
  // Find player in database to get height
  const player = await findPlayerByFuzzyName(parsed.playerName, teamName, 'upgrade');
  
  // Get full player data for height
  let playerHeight: string | undefined;
  if (player) {
    const db = await getDb();
    if (db) {
      const allPlayers = await db.select().from(players);
      const fullPlayer = allPlayers.find(p => p.id === player.id);
      playerHeight = fullPlayer?.height || undefined;
    }
  }
  
  // Validate the upgrade request
  const validation = await validateUpgradeRequest(parsed, teamName, playerHeight);
  
  // Format and send validation response
  const responseMessage = formatValidationMessage(parsed, validation);
  const reply = await message.reply(responseMessage);
  
  // Save request to database
  const db = await getDb();
  if (!db) return;
  
  await db.insert(upgradeRequests).values({
    playerId: player?.id || null,
    playerName: parsed.playerName,
    badgeName: parsed.badgeName,
    fromLevel: parsed.fromLevel,
    toLevel: parsed.toLevel,
    attributes: parsed.attributes ? JSON.stringify(parsed.attributes) : null,
    requestedBy: message.author.id,
    requestedByName: message.author.username,
    team: teamName,
    channelId: message.channelId,
    messageId: message.id,
    status: validation.valid ? 'pending' : 'rejected',
    validationErrors: validation.errors.length > 0 ? JSON.stringify(validation.errors) : null,
    ruleViolations: validation.ruleViolations.length > 0 ? JSON.stringify(validation.ruleViolations) : null
  });
  
  // If valid, add 😀 reaction for admin to see
  if (validation.valid) {
    await message.react('😀');
    console.log('[Upgrade Handler] ✅ Valid upgrade request - awaiting admin approval');
  } else {
    console.log('[Upgrade Handler] ❌ Invalid upgrade request - rejected');
  }
}

/**
 * Handle admin approval reaction (✅) on upgrade request
 */
export async function handleUpgradeApproval(message: Message, adminUser: any) {
  console.log(`[Upgrade Handler] Admin ${adminUser.username} approved upgrade`);
  
  const db = await getDb();
  if (!db) return;
  
  // Find the upgrade request in database
  const allRequests = await db.select().from(upgradeRequests);
  const request = allRequests.find(r => r.messageId === message.id);
  
  if (!request) {
    console.log('[Upgrade Handler] No upgrade request found for this message');
    return;
  }
  
  if (request.status !== 'pending') {
    console.log('[Upgrade Handler] Upgrade request already processed:', request.status);
    return;
  }
  
  // Update request status using raw SQL
  const { createConnection } = await import('mysql2/promise');
  const connection = await createConnection(process.env.DATABASE_URL!);
  
  await connection.execute(
    'UPDATE upgrade_requests SET status = ?, approvedBy = ?, approvedAt = NOW() WHERE id = ?',
    ['approved', adminUser.id, request.id]
  );
  
  await connection.end();
  
  // Post to public upgrade log channel
  const logChannel = await message.client.channels.fetch(UPGRADE_LOG_CHANNEL_ID);
  
  if (logChannel && logChannel.isTextBased()) {
    const logEmbed = {
      color: 0x00ff00, // Green
      title: '✅ Upgrade Approved',
      fields: [
        {
          name: 'Team',
          value: request.team,
          inline: true
        },
        {
          name: 'Player',
          value: request.playerName,
          inline: true
        },
        {
          name: 'Badge',
          value: `${request.badgeName}`,
          inline: true
        },
        {
          name: 'Change',
          value: `${request.fromLevel} → **${request.toLevel}**`,
          inline: true
        },
        {
          name: 'Approved By',
          value: `<@${adminUser.id}>`,
          inline: true
        },
        {
          name: 'Date',
          value: new Date().toLocaleDateString(),
          inline: true
        }
      ],
      footer: {
        text: `Requested by ${request.requestedByName}`
      },
      timestamp: new Date().toISOString()
    };
    
    // Add attributes if provided
    if (request.attributes) {
      const attrs = JSON.parse(request.attributes);
      const attrText = Object.entries(attrs)
        .map(([key, val]) => `${key}: **${val}**`)
        .join('\n');
      logEmbed.fields.push({
        name: 'Verified Attributes',
        value: attrText,
        inline: false
      });
    }
    
    if ('send' in logChannel) {
      await logChannel.send({ embeds: [logEmbed] });
    }
    console.log('[Upgrade Handler] Posted to upgrade log channel');
  }
  
  // Reply to original message
  await message.reply(`✅ **Upgrade Approved by ${adminUser.username}**\n\nThis upgrade has been logged in <#${UPGRADE_LOG_CHANNEL_ID}>`);
}

/**
 * Check if user is admin (has admin role or specific permissions)
 */
export function isAdmin(member: any): boolean {
  // Check if user has administrator permission
  if (member.permissions?.has('Administrator')) {
    return true;
  }
  
  // Check if user has a role named "Admin" or "Admins"
  const hasAdminRole = member.roles?.cache.some((role: any) => 
    role.name.toLowerCase() === 'admin' || 
    role.name.toLowerCase() === 'admins'
  );
  
  return hasAdminRole;
}
