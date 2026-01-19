/**
 * Database Service
 * 
 * Handles database connections with:
 * - Connection pooling
 * - Graceful degradation
 * - Auto-reconnection
 * - Query helpers
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { logger } from './logger';
import { config } from '../config';

// Import schema from main app
import * as schema from '../../drizzle/schema';

type DrizzleDB = ReturnType<typeof drizzle>;

class DatabaseServiceClass {
  private pool: mysql.Pool | null = null;
  private db: DrizzleDB | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;

  /**
   * Initialize database connection pool
   */
  async initialize(): Promise<void> {
    if (this.isConnected) {
      logger.debug('Database already connected');
      return;
    }

    try {
      const connectionString = config.database.connectionString;
      if (!connectionString) {
        throw new Error('DATABASE_URL is not configured');
      }

      // Create connection pool
      this.pool = mysql.createPool({
        uri: connectionString,
        waitForConnections: true,
        connectionLimit: config.database.poolSize,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });

      // Test connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      // Create Drizzle instance
      this.db = drizzle(this.pool, { schema, mode: 'default' });
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('✅ Database connection pool established');

      // Set up error handling on pool
      this.pool.on('error', (err) => {
        logger.error('Database pool error:', err);
        this.handleConnectionError();
      });

    } catch (error) {
      logger.error('Failed to initialize database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Handle connection errors with auto-reconnect
   */
  private async handleConnectionError(): Promise<void> {
    this.isConnected = false;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        logger.error('Reconnection failed:', error);
      }
    }, this.reconnectDelay);
  }

  /**
   * Get the Drizzle database instance
   * Returns null if not connected (graceful degradation)
   */
  getDb(): DrizzleDB | null {
    if (!this.isConnected || !this.db) {
      logger.warn('Database not connected - operation will be skipped');
      return null;
    }
    return this.db;
  }

  /**
   * Check if database is connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Execute a query with error handling
   */
  async query<T>(operation: (db: DrizzleDB) => Promise<T>): Promise<T | null> {
    const db = this.getDb();
    if (!db) {
      return null;
    }

    try {
      return await operation(db);
    } catch (error) {
      logger.error('Database query error:', error);
      
      // Check if it's a connection error
      if (this.isConnectionError(error)) {
        this.handleConnectionError();
      }
      
      return null;
    }
  }

  /**
   * Check if error is a connection-related error
   */
  private isConnectionError(error: unknown): boolean {
    if (error instanceof Error) {
      const connectionErrors = [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'PROTOCOL_CONNECTION_LOST',
        'ER_CON_COUNT_ERROR',
      ];
      return connectionErrors.some(code => error.message.includes(code));
    }
    return false;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.db = null;
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }
}

// Export singleton instance
export const DatabaseService = new DatabaseServiceClass();
