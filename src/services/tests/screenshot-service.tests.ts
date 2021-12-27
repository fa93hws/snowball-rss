import type { IExitHelper } from '@services/exit-helper';
import puppeteer from 'puppeteer';
import { ScreenShotService } from '../screenshot-service';
import { fakeLogger } from '../fake/logging-service';

describe('screenshotService', () => {
  const fakeUnexpectedExitHandler = jest.fn();
  const fakeExitHelper: IExitHelper = {
    onUnexpectedExit: fakeUnexpectedExitHandler,
    onExpectedExit: jest.fn(),
  };
  const service = new ScreenShotService({
    logger: fakeLogger,
    exitHelper: fakeExitHelper,
  });

  afterEach(() => {
    fakeUnexpectedExitHandler.mockRestore();
  });

  it('crash if failed to launch browser', async () => {
    fakeUnexpectedExitHandler.mockImplementationOnce((e) => {
      throw e;
    });
    const fakeLaunch = jest
      .spyOn(puppeteer, 'launch')
      .mockRejectedValueOnce(new Error('failed to launch browser'));
    const p = service.capturePage('any-url');
    await expect(p).rejects.toThrowError('failed to launch browser');
    expect(fakeUnexpectedExitHandler).toHaveBeenCalled();
    fakeLaunch.mockRestore();
  });
});
