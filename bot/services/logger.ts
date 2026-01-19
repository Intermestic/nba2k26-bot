/**
 * Logger Service
 * 
 * Memory-efficient logging with file rotation and garbage collection hints.
 * Prevents memory bloat and write EIO errors under memory pressure.
 */

import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel = 'info';
  private includeTimestamp: boolean = true;
  private logFile: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private logBuffer: string[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private bufferSize: number = 0;
  private maxBufferSize: number = 100 * 1024; // 100KB buffer before flush
  private gcInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.logFile = '/home/ubuntu/nba2k26-database/logs/bot.log';
    this.ensureLogDirectory();
    this.startBufferFlushInterval();
    this.startGarbageCollectionInterval();
  }

  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private startBufferFlushInterval(): void {
    // Flush buffer every 5 seconds or when it reaches max size
    this.bufferFlushInterval = setInterval(() => {
      this.flushBuffer();
    }, 5000);
    
    // Allow interval to be cleared on process exit
    if (this.bufferFlushInterval.unref) {
      this.bufferFlushInterval.unref();
    }
  }

  private startGarbageCollectionInterval(): void {
    // Force garbage collection every 30 seconds to prevent memory bloat
    if (global.gc) {
      this.gcInterval = setInterval(() => {
        try {
          global.gc();
        } catch (e) {
          // GC not available or failed, ignore
        }
      }, 30000);
      
      if (this.gcInterval.unref) {
        this.gcInterval.unref();
      }
    }
  }

  private flushBuffer(): void {
    if (this.logBuffer.length === 0) return;

    try {
      const content = this.logBuffer.join('\n') + '\n';
      this.logBuffer = [];
      this.bufferSize = 0;

      // Check if log file needs rotation
      this.rotateLogIfNeeded();

      // Write to file
      fs.appendFileSync(this.logFile, content, { encoding: 'utf-8' });
    } catch (error) {
      // If write fails, log to console only to avoid cascading errors
      console.error('[Logger] Failed to write to log file:', error);
    }
  }

  private rotateLogIfNeeded(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxLogSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = `${this.logFile}.${timestamp}`;
          fs.renameSync(this.logFile, rotatedFile);
          
          // Clean up old rotated logs (keep only last 5)
          this.cleanupOldLogs();
        }
      }
    } catch (error) {
      console.error('[Logger] Failed to rotate log:', error);
    }
  }

  private cleanupOldLogs(): void {
    try {
      const dir = path.dirname(this.logFile);
      const files = fs.readdirSync(dir)
        .filter(f => f.startsWith(path.basename(this.logFile) + '.'))
        .sort()
        .reverse();

      // Keep only last 5 rotated logs
      for (let i = 5; i < files.length; i++) {
        fs.unlinkSync(path.join(dir, files[i]));
      }
    } catch (error) {
      console.error('[Logger] Failed to cleanup old logs:', error);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setTimestamp(include: boolean): void {
    this.includeTimestamp = include;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.includeTimestamp 
      ? `[${new Date().toISOString()}] ` 
      : '';
    const levelTag = `[${level.toUpperCase()}]`;
    return `${timestamp}${levelTag} ${message}`;
  }

  private formatArgs(args: unknown[]): string {
    return args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  private addToBuffer(message: string): void {
    this.logBuffer.push(message);
    this.bufferSize += message.length;

    // Flush if buffer is getting too large
    if (this.bufferSize > this.maxBufferSize) {
      this.flushBuffer();
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message);
      const argsStr = args.length > 0 ? ' ' + this.formatArgs(args) : '';
      const fullMessage = formatted + argsStr;
      console.debug(fullMessage);
      this.addToBuffer(fullMessage);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message);
      const argsStr = args.length > 0 ? ' ' + this.formatArgs(args) : '';
      const fullMessage = formatted + argsStr;
      console.info(fullMessage);
      this.addToBuffer(fullMessage);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message);
      const argsStr = args.length > 0 ? ' ' + this.formatArgs(args) : '';
      const fullMessage = formatted + argsStr;
      console.warn(fullMessage);
      this.addToBuffer(fullMessage);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message);
      const argsStr = args.length > 0 ? ' ' + this.formatArgs(args) : '';
      const fullMessage = formatted + argsStr;
      console.error(fullMessage);
      this.addToBuffer(fullMessage);
    }
  }

  /**
   * Log a structured event for monitoring
   */
  event(eventName: string, data: Record<string, unknown>): void {
    this.info(`[EVENT:${eventName}]`, data);
  }

  /**
   * Flush all buffered logs and cleanup
   */
  shutdown(): void {
    this.flushBuffer();
    
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }
    
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Cleanup on process exit
process.on('exit', () => {
  logger.shutdown();
});

process.on('SIGTERM', () => {
  logger.shutdown();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.shutdown();
  process.exit(0);
});
