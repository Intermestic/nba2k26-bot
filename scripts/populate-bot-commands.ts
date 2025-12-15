import { getDb } from '../server/db';
import { botCommands } from '../drizzle/schema';

async function populateBotCommands() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  const commands = [
    {
      command: '!ab-records',
      description: 'Display activity booster team records and standings',
      category: 'activity',
      requiredPermission: 'everyone',
      enabled: true,
      responseTemplate: null
    },
    {
      command: '!update bid',
      description: 'Update your FA bid amount for a player',
      category: 'fa',
      requiredPermission: 'everyone',
      enabled: true,
      responseTemplate: null
    },
    {
      command: '!updateovercap',
      description: 'Manually update overcap roles for all teams',
      category: 'admin',
      requiredPermission: 'admin',
      enabled: true,
      responseTemplate: null
    },
    {
      command: '/updatecap',
      description: 'Update cap status messages in configured channel',
      category: 'admin',
      requiredPermission: 'admin',
      enabled: true,
      responseTemplate: null
    },
    {
      command: '!regenerate-summary',
      description: 'Regenerate FA window summary for a specific window',
      category: 'admin',
      requiredPermission: 'admin',
      enabled: true,
      responseTemplate: null
    },
    {
      command: '!rollback',
      description: 'Rollback FA transaction batch by batch ID',
      category: 'admin',
      requiredPermission: 'admin',
      enabled: true,
      responseTemplate: null
    },
    {
      command: '!sync-team-roles',
      description: 'Manually sync team roles from the team message',
      category: 'admin',
      requiredPermission: 'admin',
      enabled: true,
      responseTemplate: null
    },
    {
      command: '!sync-team-channels',
      description: 'Manually sync team channels and update topics',
      category: 'admin',
      requiredPermission: 'admin',
      enabled: true,
      responseTemplate: null
    },
    {
      command: '!badge',
      description: 'Look up badge information by abbreviation or list all badges',
      category: 'info',
      requiredPermission: 'everyone',
      enabled: true,
      responseTemplate: null
    }
  ];

  try {
    // Clear existing commands first
    await db.delete(botCommands);
    console.log('Cleared existing bot commands');

    // Insert all commands
    for (const cmd of commands) {
      await db.insert(botCommands).values(cmd);
      console.log(`✓ Added command: ${cmd.command}`);
    }

    console.log(`\n✅ Successfully populated ${commands.length} bot commands`);
  } catch (error) {
    console.error('Error populating bot commands:', error);
    process.exit(1);
  }

  process.exit(0);
}

populateBotCommands();
