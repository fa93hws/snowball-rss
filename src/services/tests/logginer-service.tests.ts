import { Logger } from '../logging-service';
import * as fs from 'fs';
import * as path from 'path';

describe('Logger', () => {
  beforeAll(() => {
    fs.rmdirSync('fixtures/logs', { recursive: true });
    const logger = new Logger({
      dirname: path.join(__dirname, 'fixtures', 'logs'),
      enableConsole: false,
    });
    logger.debug('debug');
    logger.error('error');
    logger.info('info');
    logger.verbose('verbose');
    logger.warn('warn');
  });

  it('write logs to hard disk', () => {
    const logDir = path.join(__dirname, 'fixtures', 'logs');
    expect(fs.existsSync(path.join(logDir, 'winston.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'error.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'info.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'warn.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'verbose.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'debug.log'))).toBeTruthy();
  });
});
