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
      new winston.transports.File({ dirname }),
      new winston.transports.File({
        dirname,
        level: 'error',
      }),
      new winston.transports.File({
        dirname,
        level: 'warn',
      }),
      new winston.transports.File({
        dirname,
        level: 'info',
        maxsize: 20 * 1024 * 1024,
      }),
    );
    transports.push(
      new winston.transports.File({
        dirname,
        level: 'verbose',
        maxsize: 20 * 1024 * 1024,
      }),
      new winston.transports.File({
        dirname,
        level: 'debug',
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
