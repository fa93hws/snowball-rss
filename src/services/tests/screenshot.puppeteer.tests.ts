import type { IExitHelper } from '@services/exit-helper';
import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import { addTextWaterMark } from '../watermark-service';
import { ScreenShotService } from '../screenshot-service';
import { fakeLogger } from '../fake/logging-service';

describe('screenshot', () => {
  jest.setTimeout(60000);

  const fakeExitHelper: IExitHelper = {
    onExpectedExit: jest.fn(),
    onUnexpectedExit: jest.fn(),
  };

  const service = new ScreenShotService({
    logger: fakeLogger,
    exitHelper: fakeExitHelper,
    addWatermark: async (buffer) => {
      return addTextWaterMark({
        buffer,
        position: {
          x: 0.05,
          y: 0.9,
          relative: true,
        },
        text: 'watermark-in jest',
        mime: Jimp.MIME_PNG,
      });
    },
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
