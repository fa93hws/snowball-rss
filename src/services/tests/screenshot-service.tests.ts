import type { ICrashService } from '@services/crash-service';
import puppeteer from 'puppeteer';
import { ScreenShotService } from '../screenshot-service';
import { fakeLogger } from '../fake/logging-service';

describe('screenshotService', () => {
  const fakeCrash = jest.fn();
  const fakeCrashService: ICrashService = {
    crash: fakeCrash,
  };
  const service = new ScreenShotService({
    logger: fakeLogger,
    crashService: fakeCrashService,
  });

  afterEach(() => {
    fakeCrash.mockRestore();
  });

  it('crash if failed to launch browser', async () => {
    fakeCrash.mockImplementationOnce((e) => {
      throw e;
    });
    const fakeLaunch = jest
      .spyOn(puppeteer, 'launch')
      .mockRejectedValueOnce(new Error('failed to launch browser'));
    const p = service.capturePage('any-url');
    await expect(p).rejects.toThrowError('failed to launch browser');
    expect(fakeCrash).toHaveBeenCalled();
    fakeLaunch.mockRestore();
  });
});
