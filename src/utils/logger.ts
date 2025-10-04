/**
 * Centralized logging utility
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development' || !require('electron').app.isPackaged;
  }

  private formatMessage(level: LogLevel, message: string, ..._args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage(LogLevel.ERROR, message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage(LogLevel.WARN, message), ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(this.formatMessage(LogLevel.INFO, message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), ...args);
    }
  }
}

export const logger = new Logger();
