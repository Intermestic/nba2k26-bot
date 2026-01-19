/**
 * Health Monitoring Service
 * 
 * Provides:
 * - Periodic health checks
 * - HTTP health endpoint
 * - Heartbeat logging
 * - Auto-recovery triggers
 */

import { Client } from 'discord.js';
import http from 'http';
import { logger } from './logger';
import { DatabaseService } from './database';
import { config } from '../config';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  discord: {
    connected: boolean;
    latency: number;
    guilds: number;
  };
  database: {
    connected: boolean;
  };
  lastCheck: string;
  errors: string[];
}

class HealthServiceClass {
  private client: Client | null = null;
  private httpServer: http.Server | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  private recentErrors: string[] = [];
  private maxRecentErrors: number = 10;

  /**
   * Initialize health monitoring
   */
  initialize(client: Client): void {
    this.client = client;
    this.startTime = Date.now();
    
    // Start heartbeat logging
    this.startHeartbeat();
    
    // Start periodic health checks
    this.startHealthChecks();
    
    // Start HTTP health endpoint
    this.startHttpServer();
    
    logger.info('✅ Health monitoring initialized');
  }

  /**
   * Start heartbeat logging (every 30 seconds)
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const status = this.getStatus();
      logger.debug(`💓 Heartbeat: ${status.status} | Discord: ${status.discord.connected ? 'connected' : 'disconnected'} | DB: ${status.database.connected ? 'connected' : 'disconnected'} | Uptime: ${this.formatUptime(status.uptime)}`);
    }, 30000); // 30 seconds
  }

  /**
   * Start periodic health checks (every 60 seconds)
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // 60 seconds
  }

  /**
   * Perform a full health check
   */
  private async performHealthCheck(): Promise<void> {
    const status = this.getStatus();
    
    // Log status changes
    if (status.status === 'unhealthy') {
      logger.error('🚨 Health check FAILED:', status.errors);
    } else if (status.status === 'degraded') {
      logger.warn('⚠️ Health check DEGRADED:', status.errors);
    }

    // Attempt auto-recovery if needed
    if (!status.discord.connected && this.client) {
      logger.info('Attempting Discord reconnection...');
      // Discord.js handles reconnection automatically, but we log it
    }

    if (!status.database.connected) {
      logger.info('Attempting database reconnection...');
      try {
        await DatabaseService.initialize();
      } catch (error) {
        logger.error('Database reconnection failed:', error);
      }
    }
  }

  /**
   * Start HTTP health endpoint server
   */
  private startHttpServer(): void {
    const port = process.env.HEALTH_PORT || 3001;
    
    this.httpServer = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/') {
        const status = this.getStatus();
        const httpStatus = status.status === 'healthy' ? 200 : 
                          status.status === 'degraded' ? 200 : 503;
        
        res.writeHead(httpStatus, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
      } else if (req.url === '/ready') {
        // Readiness check - is the bot ready to handle requests?
        const ready = this.client?.isReady() && DatabaseService.isHealthy();
        res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ready }));
      } else if (req.url === '/restart' && req.method === 'POST') {
        // Restart webhook - triggered by scheduled task
        logger.warn('🔄 Restart requested via webhook');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Restart initiated', timestamp: new Date().toISOString() }));
        
        // Gracefully shutdown and let process manager restart
        setTimeout(() => {
          logger.info('Shutting down for restart...');
          process.exit(0);
        }, 1000);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    this.httpServer.listen(port, () => {
      logger.info(`📡 Health endpoint running on port ${port}`);
    });

    this.httpServer.on('error', (error) => {
      logger.error('Health server error:', error);
    });
  }

  /**
   * Get current health status
   */
  getStatus(): HealthStatus {
    const discordConnected = this.client?.isReady() ?? false;
    const dbConnected = DatabaseService.isHealthy();
    
    const errors: string[] = [];
    if (!discordConnected) errors.push('Discord disconnected');
    if (!dbConnected) errors.push('Database disconnected');
    errors.push(...this.recentErrors);

    let status: HealthStatus['status'] = 'healthy';
    if (!discordConnected) {
      status = 'unhealthy';
    } else if (!dbConnected) {
      status = 'degraded'; // Can still operate without DB (graceful degradation)
    } else if (this.recentErrors.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      discord: {
        connected: discordConnected,
        latency: this.client?.ws.ping ?? -1,
        guilds: this.client?.guilds.cache.size ?? 0,
      },
      database: {
        connected: dbConnected,
      },
      lastCheck: new Date().toISOString(),
      errors: errors.slice(0, 5), // Only show first 5 errors
    };
  }

  /**
   * Record an error for tracking
   */
  recordError(error: string): void {
    this.recentErrors.unshift(error);
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors.pop();
    }
  }

  /**
   * Clear recent errors
   */
  clearErrors(): void {
    this.recentErrors = [];
  }

  /**
   * Format uptime in human readable format
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || '< 1m';
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
    
    logger.info('Health monitoring stopped');
  }
}

// Export singleton
export const HealthService = new HealthServiceClass();
