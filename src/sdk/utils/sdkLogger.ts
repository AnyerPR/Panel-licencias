import { LoggerConfig, LogLevel } from '../types/sdkTypes';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  none: 5,
};

export class SdkLogger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      level: config.level || 'info',
      customLogger: config.customLogger,
    };
  }

  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    const currentWeight = LOG_LEVELS[this.config.level || 'info'];
    const targetWeight = LOG_LEVELS[level];
    return targetWeight >= currentWeight;
  }

  public debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  public info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    if (this.config.customLogger) {
      this.config.customLogger(level, message, data);
      return;
    }

    const timestamp = new Date().toLocaleTimeString('es-ES');
    const prefix = `[SDK Licencias][${timestamp}][${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.debug(`${prefix} ${message}`, data ?? '');
        break;
      case 'info':
        console.info(`${prefix} ${message}`, data ?? '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data ?? '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data ?? '');
        break;
    }
  }
}
