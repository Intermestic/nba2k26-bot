import { getDiscordBotStatus } from './server/discord-bot.js';

const status = getDiscordBotStatus();
console.log('Bot Status:', JSON.stringify(status, null, 2));
process.exit(0);
