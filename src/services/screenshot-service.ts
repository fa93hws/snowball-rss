import puppeteer from 'puppeteer';
import type { ILogger } from '@services/logging-service';
import { Result } from '@utils/result';
import type { ICrashService } from './crash-service';

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
  private readonly crashService: ICrashService;

  constructor(services: { logger: ILogger; crashService: ICrashService }) {
    this.logger = services.logger;
    this.crashService = services.crashService;
  }

  private async launchBrowser(): Promise<puppeteer.Browser> {
    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      return browser;
    } catch (e) {
      return this.crashService.crash(e);
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
      return Result.ok(buffer);
    } catch (e) {
      await browser.close();
      this.logger.error(`failed to take snapshot for ${url}, error is`);
      this.logger.error(e);
      return Result.err(e);
    }
  }
}
