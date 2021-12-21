import * as winston from 'winston';
import type { transport as Transport } from 'winston';

export class Logger {
  private readonly logger: winston.Logger;

  constructor() {
    const transports: Transport[] = [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/app/combined.log' }),
      new winston.transports.File({
        filename: 'logs/app/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/app/warn.log',
        level: 'warn',
      }),
      new winston.transports.File({
        filename: 'logs/app/info.log',
        level: 'info',
        maxsize: 20 * 1024 * 1024,
      }),
    ];
    transports.push(
      new winston.transports.File({
        filename: 'logs/app/verbose.log',
        level: 'verbose',
        maxsize: 20 * 1024 * 1024,
      }),
      new winston.transports.File({
        filename: 'logs/app/debug.log',
        level: 'debug',
        maxsize: 20 * 1024 * 1024,
      }),
    );
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
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
