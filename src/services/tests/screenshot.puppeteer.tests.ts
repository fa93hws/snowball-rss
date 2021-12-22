import { ScreenShotService } from '../screenshot-service';
import { fakeLogger } from '../fake/logging-service';
import fs from 'fs';
import path from 'path';

describe('screenshot', () => {
  jest.setTimeout(60000);
  const service = new ScreenShotService(fakeLogger);
  it('take a screenshot for a given url', async () => {
    const url = 'https://xueqiu.com/1334706236/174333684';
    const bufferResult = await service.capturePage(url);
    if (bufferResult.isOk === false) {
      throw bufferResult.error;
    }
    fs.writeFileSync(path.join(__dirname, 'screenshot.png'), bufferResult.value, {
      encoding: 'binary',
    });
    expect(bufferResult.isOk).toBe(true);
  });
});
