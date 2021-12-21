import * as puppeteer from 'puppeteer';
import { Result } from './result';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

async function maybeCloseLoginModal(page: puppeteer.Page) {
  const closeButton = await page.$<HTMLAnchorElement>(
    'div.modal.modal__login>a.close',
  );
  if (closeButton != null) {
    await closeButton.evaluate((b) => b.click());
  }
}

export async function takeScreenShot(url: string) {
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
      type: 'jpeg',
      quality: 80,
      encoding: 'binary',
    });
    if (typeof buffer === 'string') {
      throw new Error('we should get buffer for screenshot taken by puppeteer');
    }
    await browser.close();
    return Result.ok(buffer);
  } catch (e) {
    await browser.close();
    return Result.err(e);
  }
}
