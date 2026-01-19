/**
 * Logger Service
 * 
 * Simple, clean logging with timestamps and log levels.
 * Can be extended to write to files or external services.
 */

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

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message);
      const argsStr = args.length > 0 ? ' ' + this.formatArgs(args) : '';
      console.debug(formatted + argsStr);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message);
      const argsStr = args.length > 0 ? ' ' + this.formatArgs(args) : '';
      console.info(formatted + argsStr);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message);
      const argsStr = args.length > 0 ? ' ' + this.formatArgs(args) : '';
      console.warn(formatted + argsStr);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message);
      const argsStr = args.length > 0 ? ' ' + this.formatArgs(args) : '';
      console.error(formatted + argsStr);
    }
  }

  /**
   * Log a structured event for monitoring
   */
  event(eventName: string, data: Record<string, unknown>): void {
    this.info(`[EVENT:${eventName}]`, data);
  }
}

// Export singleton instance
export const logger = new Logger();
