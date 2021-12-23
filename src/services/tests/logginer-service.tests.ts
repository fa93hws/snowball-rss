import { Logger } from '../logging-service';
import * as fs from 'fs';
import * as path from 'path';

describe('Logger', () => {
  const logDir = path.join(__dirname, 'fixtures', 'generated-logs');

  beforeAll(async () => {
    if (fs.existsSync(logDir)) {
      fs.rmdirSync(logDir, { recursive: true });
    }
    const logger = new Logger({
      dirname: logDir,
      enableConsole: false,
    });
    logger.debug('debug');
    logger.error('error');
    logger.info('info');
    logger.verbose('verbose');
    logger.warn('warn');

    // wait till logs are written
    for (let i = 0; i < 100; i++) {
      if (fs.existsSync(logDir) && fs.readdirSync(logDir).length === 6) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  });

  it('write logs to hard disk', () => {
    expect(fs.existsSync(path.join(logDir, 'combined.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'error.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'info.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'warn.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'verbose.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(logDir, 'debug.log'))).toBeTruthy();
  });
});
