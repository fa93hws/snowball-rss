import puppeteer from 'puppeteer';
import type { ILogger } from '@services/logging-service';
import { Result } from '@utils/result';

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
  constructor(private readonly logger: ILogger) {}

  async capturePage(url: string): Promise<Result.Result<Buffer, unknown>> {
    this.logger.verbose(`taking snapshot for ${url}`);
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
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
