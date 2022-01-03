import puppeteer from 'puppeteer';
import type { ILogger } from '@services/logging-service';
import { Result } from '@utils/result';
import type { IExitHelper } from './exit-helper';

export interface IScreenShotService {
  capturePage(url: string): Promise<Result.Result<Buffer, unknown>>;
}

async function maybeCloseLoginModal(page: puppeteer.Page) {
  const closeButton = await page.$<HTMLAnchorElement>('div.modal.modal__login>a.close');
  if (closeButton != null) {
    await closeButton.evaluate((b) => b.click());
  }
}

export class ScreenShotService implements IScreenShotService {
  private readonly logger: ILogger;
  private readonly exitHelper: IExitHelper;
  private readonly addWatermark?: (buffer: Buffer) => Promise<Buffer>;

  constructor(services: {
    logger: ILogger;
    exitHelper: IExitHelper;
    addWatermark?: (buffer: Buffer) => Promise<Buffer>;
  }) {
    this.logger = services.logger;
    this.exitHelper = services.exitHelper;
    this.addWatermark = services.addWatermark;
  }

  private async launchBrowser(): Promise<puppeteer.Browser> {
    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      return browser;
    } catch (e) {
      return this.exitHelper.onUnexpectedExit(e);
    }
  }

  async capturePage(url: string): Promise<Result.Result<Buffer, unknown>> {
    this.logger.info(`taking snapshot for ${url}`);
    const browser = await this.launchBrowser();
    try {
      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle0',
      });
      await page.waitForTimeout(1000);
      await maybeCloseLoginModal(page);
      const buffer = await page.screenshot({
        type: 'png',
        encoding: 'binary',
        fullPage: true,
      });
      if (typeof buffer === 'string') {
        throw new Error('we should get buffer for screenshot taken by puppeteer');
      }
      await browser.close();
      this.logger.info(`snapshot has been taken for ${url}`);
      if (this.addWatermark != null) {
        const watermarked = await this.addWatermark(buffer);
        return Result.ok(watermarked);
      }
      return Result.ok(buffer);
    } catch (e) {
      await browser.close();
      this.logger.error(`failed to take snapshot for ${url}, error is`, e);
      return Result.err(e);
    }
  }
}
