import winston from 'winston';
import type { transport as Transport } from 'winston';

export interface ILogger {
  info(message: any): void;
  error(message: any): void;
  warn(message: any): void;
  verbose(message: any): void;
  debug(message: any): void;
}

export class Logger {
  private readonly logger: winston.Logger;

  constructor({ dirname, enableConsole = true }: { dirname: string; enableConsole?: boolean }) {
    const transports: Transport[] = [];
    if (enableConsole) {
      transports.push(new winston.transports.Console());
    }
    transports.push(
      new winston.transports.File({ dirname, filename: 'combined.log' }),
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

  info(message: any) {
    this.logger.info(message);
  }
  error(message: any) {
    this.logger.error(message);
  }
  warn(message: any) {
    this.logger.warn(message);
  }
  verbose(message: any) {
    this.logger.verbose(message);
  }
  debug(message: any) {
    this.logger.debug(message);
  }
}
