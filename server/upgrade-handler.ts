import { Message } from 'discord.js';
import { parseUpgradeRequests } from './upgrade-parser';
import { validateUpgradeRequest, formatValidationMessage } from './upgrade-validator';
import { getDb } from './db';
import { upgradeRequests, players, teamAssignments } from '../drizzle/schema';
import { findPlayerByFuzzyName } from './trade-parser';

const UPGRADE_LOG_CHANNEL_ID = process.env.UPGRADE_LOG_CHANNEL_ID || '1149106208498790500';

/**
 * Handle upgrade request message from team channel
 * Now supports multiple players and multiple upgrades in one message
 */
export async function handleUpgradeRequest(message: Message, teamName: string) {
  console.log(`[Upgrade Handler] Processing message in ${teamName} channel`);
  
  const text = message.content.trim();
  
  // Check if message contains upgrade keywords
  if (!text.match(/upgrade|badge|bronze|silver|gold|\+\d/i)) {
    return; // Not an upgrade request
  }
  
  // Parse all upgrade requests in the message
  const parsedUpgrades = await parseUpgradeRequests(text);
  
  if (parsedUpgrades.length === 0) {
    console.log('[Upgrade Handler] Could not parse any upgrade requests');
    return; // Not a valid upgrade format
  }
  
  console.log(`[Upgrade Handler] Parsed ${parsedUpgrades.length} upgrades`);
  
  // Process each upgrade
  const results: Array<{
    upgrade: typeof parsedUpgrades[0];
    validation: Awaited<ReturnType<typeof validateUpgradeRequest>>;
    playerHeight?: string;
  }> = [];
  
  for (const parsed of parsedUpgrades) {
    console.log('[Upgrade Handler] Processing upgrade:', parsed);
    
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
    
    results.push({ upgrade: parsed, validation, playerHeight });
    
    // Save request to database
    const db = await getDb();
    if (db) {
      await db.insert(upgradeRequests).values({
        playerId: player?.id || null,
        playerName: parsed.playerName,
        badgeName: parsed.badgeName,
        fromLevel: parsed.fromLevel,
        toLevel: parsed.toLevel,
        attributes: parsed.attributes ? JSON.stringify(parsed.attributes) : null,
        gameNumber: parsed.gameNumber || null,
        requestedBy: message.author.id,
        requestedByName: message.author.username,
        team: teamName,
        channelId: message.channelId,
        messageId: message.id,
        status: validation.valid ? 'pending' : 'rejected',
        validationErrors: validation.errors.length > 0 ? JSON.stringify(validation.errors) : null,
        ruleViolations: validation.ruleViolations.length > 0 ? JSON.stringify(validation.ruleViolations) : null
      });
    }
  }
  
  // Format combined response
  const responseLines: string[] = [];
  let allValid = true;
  
  if (results.length > 1) {
    responseLines.push(`**Processing ${results.length} upgrade requests:**\n`);
  }
  
  for (const result of results) {
    const formattedMessage = formatValidationMessage(result.upgrade, result.validation);
    responseLines.push(formattedMessage);
    responseLines.push(''); // Blank line between upgrades
    
    if (!result.validation.valid) {
      allValid = false;
    }
  }
  
  // Send combined response
  const reply = await message.reply(responseLines.join('\n'));
  
  // If all valid, add 😀 reaction for admin to see
  if (allValid && results.length > 0) {
    await message.react('😀');
    console.log('[Upgrade Handler] ✅ All upgrade requests valid - awaiting admin approval');
  } else {
    console.log('[Upgrade Handler] ❌ Some upgrade requests rejected');
  }
}

/**
 * Handle admin approval reaction (✅) on upgrade request
 */
export async function handleUpgradeApproval(message: Message, adminUser: any) {
  console.log(`[Upgrade Handler] Admin ${adminUser.username} approved upgrade`);
  
  const db = await getDb();
  if (!db) return;
  
  // Find all upgrade requests for this message
  const allRequests = await db.select().from(upgradeRequests);
  const requests = allRequests.filter(r => r.messageId === message.id && r.status === 'pending');
  
  if (requests.length === 0) {
    console.log('[Upgrade Handler] No pending upgrade requests found for this message');
    return;
  }
  
  console.log(`[Upgrade Handler] Approving ${requests.length} upgrade requests`);
  
  // Update all requests and add to player_upgrades
  const { createConnection } = await import('mysql2/promise');
  const connection = await createConnection(process.env.DATABASE_URL!);
  
  for (const request of requests) {
    // Update request status
    await connection.execute(
      'UPDATE upgrade_requests SET status = ?, approvedBy = ?, approvedAt = NOW() WHERE id = ?',
      ['approved', adminUser.id, request.id]
    );
    
    // Add to player_upgrades table
    if (request.playerId) {
      await connection.execute(
        'INSERT INTO player_upgrades (playerId, badgeName, fromLevel, toLevel, gameNumber, approvedBy, approvedAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [request.playerId, request.badgeName, request.fromLevel, request.toLevel, request.gameNumber || null, adminUser.id]
      );
    }
  }
  
  await connection.end();
  
  // Post to upgrade log channel
  const logChannel = await message.client.channels.fetch(UPGRADE_LOG_CHANNEL_ID);
  if (logChannel && 'send' in logChannel) {
    for (const request of requests) {
      const logEmbed = {
        color: 0x00ff00,
        title: '✅ Badge Upgrade Approved',
        fields: [
          { name: 'Player', value: request.playerName, inline: true },
          { name: 'Team', value: request.team, inline: true },
          { name: 'Badge', value: `${request.badgeName} (${request.fromLevel} → ${request.toLevel})`, inline: false },
          { name: 'Approved By', value: `<@${adminUser.id}>`, inline: true },
          { name: 'Requested By', value: `<@${request.requestedBy}>`, inline: true },
        ],
        timestamp: new Date().toISOString(),
      };
      
      if (request.attributes) {
        const attrs = JSON.parse(request.attributes);
        const attrText = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
        logEmbed.fields.push({ name: 'Attributes', value: attrText, inline: false });
      }
      
      await logChannel.send({ embeds: [logEmbed] });
    }
    console.log('[Upgrade Handler] Posted to upgrade log channel');
  }
  
  // Reply to original message
  const upgradeCount = requests.length;
  const upgradeWord = upgradeCount === 1 ? 'Upgrade' : 'Upgrades';
  await message.reply(`✅ **${upgradeCount} ${upgradeWord} Approved by ${adminUser.username}**\n\nThese upgrades have been logged in <#${UPGRADE_LOG_CHANNEL_ID}>`);
}

/**
 * Check if user is admin (has admin role or specific permissions)
 */
export function isAdmin(member: any): boolean {
  return member.permissions.has('Administrator') || 
         member.roles.cache.some((role: any) => role.name.toLowerCase().includes('admin'));
}
