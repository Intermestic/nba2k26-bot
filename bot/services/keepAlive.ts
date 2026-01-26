import axios from 'axios';

/**
 * Keep-Alive Service
 * 
 * Prevents Manus sandbox hibernation by:
 * 1. Self-pinging the health endpoint every 5 minutes
 * 2. Pinging the main web server every 5 minutes
 * 3. Updating Discord bot presence every 10 minutes
 * 
 * This ensures the sandbox stays active and the bot maintains uptime.
 */

export class KeepAliveService {
  private healthPingInterval: NodeJS.Timeout | null = null;
  private webServerPingInterval: NodeJS.Timeout | null = null;
  private discordClient: any = null;
  
  // Ping intervals in milliseconds
  private readonly HEALTH_PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly WEB_SERVER_PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  // URLs to ping
  private readonly HEALTH_URL = 'http://localhost:3001/health';
  private readonly WEB_SERVER_URL = process.env.VITE_API_URL || 'http://localhost:3000';

  constructor(discordClient?: any) {
    this.discordClient = discordClient;
  }

  /**
   * Start the keep-alive system
   */
  start(): void {
    console.log('[KeepAlive] Starting keep-alive service...');
    
    // Start health endpoint pinging
    this.startHealthPing();
    
    // Start web server pinging
    this.startWebServerPing();
    
    console.log('[KeepAlive] ✅ Keep-alive service started');
    console.log(`[KeepAlive] Health ping: every ${this.HEALTH_PING_INTERVAL / 1000}s`);
    console.log(`[KeepAlive] Web server ping: every ${this.WEB_SERVER_PING_INTERVAL / 1000}s`);
  }

  /**
   * Stop the keep-alive system
   */
  stop(): void {
    console.log('[KeepAlive] Stopping keep-alive service...');
    
    if (this.healthPingInterval) {
      clearInterval(this.healthPingInterval);
      this.healthPingInterval = null;
    }
    
    if (this.webServerPingInterval) {
      clearInterval(this.webServerPingInterval);
      this.webServerPingInterval = null;
    }
    
    console.log('[KeepAlive] ✅ Keep-alive service stopped');
  }

  /**
   * Ping the health endpoint to keep bot process active
   */
  private startHealthPing(): void {
    // Initial ping
    this.pingHealth();
    
    // Set up interval
    this.healthPingInterval = setInterval(() => {
      this.pingHealth();
    }, this.HEALTH_PING_INTERVAL);
  }

  /**
   * Ping the web server to keep sandbox active
   */
  private startWebServerPing(): void {
    // Initial ping
    this.pingWebServer();
    
    // Set up interval
    this.webServerPingInterval = setInterval(() => {
      this.pingWebServer();
    }, this.WEB_SERVER_PING_INTERVAL);
  }

  /**
   * Execute health endpoint ping
   */
  private async pingHealth(): Promise<void> {
    try {
      const response = await axios.get(this.HEALTH_URL, {
        timeout: 5000,
        headers: {
          'User-Agent': 'KeepAlive-Service/1.0'
        }
      });
      
      console.log(`[KeepAlive] Health ping successful: ${response.data.status}`);
    } catch (error: any) {
      console.error(`[KeepAlive] Health ping failed:`, error.message);
    }
  }

  /**
   * Execute web server ping
   */
  private async pingWebServer(): Promise<void> {
    try {
      const response = await axios.get(this.WEB_SERVER_URL, {
        timeout: 5000,
        headers: {
          'User-Agent': 'KeepAlive-Service/1.0'
        }
      });
      
      console.log(`[KeepAlive] Web server ping successful (status: ${response.status})`);
    } catch (error: any) {
      console.error(`[KeepAlive] Web server ping failed:`, error.message);
    }
  }

  /**
   * Update Discord bot presence to show activity
   */
  updatePresence(): void {
    if (!this.discordClient || !this.discordClient.user) {
      return;
    }

    try {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      this.discordClient.user.setPresence({
        activities: [{
          name: `Uptime: ${hours}h ${minutes}m`,
          type: 3 // Watching
        }],
        status: 'online'
      });
      
      console.log(`[KeepAlive] Discord presence updated (uptime: ${hours}h ${minutes}m)`);
    } catch (error: any) {
      console.error(`[KeepAlive] Failed to update Discord presence:`, error.message);
    }
  }
}

// Export singleton instance
let keepAliveInstance: KeepAliveService | null = null;

export function initializeKeepAlive(discordClient?: any): KeepAliveService {
  if (!keepAliveInstance) {
    keepAliveInstance = new KeepAliveService(discordClient);
  }
  return keepAliveInstance;
}

export function getKeepAlive(): KeepAliveService | null {
  return keepAliveInstance;
}
