import { Client } from 'discord.js';

/**
 * Singleton to share Discord client between bot and web server
 */
class DiscordClientSingleton {
  private static instance: DiscordClientSingleton;
  private client: Client | null = null;

  private constructor() {}

  public static getInstance(): DiscordClientSingleton {
    if (!DiscordClientSingleton.instance) {
      DiscordClientSingleton.instance = new DiscordClientSingleton();
    }
    return DiscordClientSingleton.instance;
  }

  public setClient(client: Client): void {
    this.client = client;
    console.log('[ClientSingleton] Discord client registered');
  }

  public getClient(): Client | null {
    return this.client;
  }

  public isReady(): boolean {
    return this.client !== null && this.client.isReady();
  }
}

export const clientSingleton = DiscordClientSingleton.getInstance();
