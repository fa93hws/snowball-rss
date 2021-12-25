import type { ICrashService } from '@services/crash-service';
import fs from 'fs';
import path from 'path';
import { ScreenShotService } from '../screenshot-service';
import { fakeLogger } from '../fake/logging-service';

describe('screenshot', () => {
  jest.setTimeout(60000);

  const fakeCrashService: ICrashService = {
    crash: jest.fn(),
  };
  const service = new ScreenShotService({
    logger: fakeLogger,
    crashService: fakeCrashService,
  });

  it('take a screenshot for a given url', async () => {
    const url = 'https://xueqiu.com/1334706236/174333684';
    const bufferResult = await service.capturePage(url);
    if (bufferResult.isOk === false) {
      throw bufferResult.error;
    }
    fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'fixtures', 'screenshot.png'), bufferResult.value, {
      encoding: 'binary',
    });
    expect(bufferResult.isOk).toBe(true);
  });
});
