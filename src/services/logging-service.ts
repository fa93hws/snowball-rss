import winston from 'winston';
import type { transport as Transport } from 'winston';

export interface ILogger {
  logFileDirname: string;
  logFileName: string;

  info(message: any, ...meta: any[]): void;
  error(message: any, ...meta: any[]): void;
  warn(message: any, ...meta: any[]): void;
  verbose(message: any, ...meta: any[]): void;
  debug(message: any, ...meta: any[]): void;
}

export class Logger implements ILogger {
  private readonly logger: winston.Logger;
  readonly logFileDirname: string;
  readonly logFileName = 'combined.log';

  constructor({ dirname, enableConsole = true }: { dirname: string; enableConsole?: boolean }) {
    this.logFileDirname = dirname;
    const transports: Transport[] = [];
    if (enableConsole) {
      transports.push(new winston.transports.Console());
    }
    transports.push(
      new winston.transports.File({ dirname, filename: this.logFileName }),
      new winston.transports.File({
        dirname,
        level: 'error',
        filename: 'error.log',
      }),
      new winston.transports.File({
        dirname,
        level: 'warn',
        filename: 'warn.log',
      }),
      new winston.transports.File({
        dirname,
        level: 'info',
        filename: 'info.log',
        maxsize: 20 * 1024 * 1024,
      }),
    );
    transports.push(
      new winston.transports.File({
        dirname,
        level: 'verbose',
        filename: 'verbose.log',
        maxsize: 20 * 1024 * 1024,
      }),
      new winston.transports.File({
        dirname,
        level: 'debug',
        filename: 'debug.log',
        maxsize: 20 * 1024 * 1024,
      }),
    );
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports,
    });
  }

  info(message: any, ...meta: any[]) {
    this.logger.info(message, ...meta);
  }
  error(message: any, ...meta: any[]) {
    this.logger.error(message, ...meta);
  }
  warn(message: any, ...meta: any[]) {
    this.logger.warn(message, ...meta);
  }
  verbose(message: any, ...meta: any[]) {
    this.logger.verbose(message, ...meta);
  }
  debug(message: any, ...meta: any[]) {
    this.logger.debug(message, ...meta);
  }
}
