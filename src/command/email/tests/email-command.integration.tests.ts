import { fakeLogger } from '@services/fake/logging-service';
import type { IMailService } from '@services/mail-service';
import type { IRssHubService } from '@services/rss/rsshub-service';
import type { IScreenShotService } from '@services/screenshot-service';
import { startProducer } from '../email-command';

describe('startProducer', () => {
  const fakeSendMail = jest.fn();
  const mailService: IMailService = { send: fakeSendMail };
  const fakeCaptureScreenshot = jest.fn();
  const screenshotService: IScreenShotService = { capturePage: fakeCaptureScreenshot };
  const fakeRssRequest = jest.fn();
  const fakeRssHubService: IRssHubService = { request: fakeRssRequest, init: jest.fn() };

  test('happy path', async () => {
    startProducer({
      intervalSecond: 1000,
      snowballUserId: 'snowballUserId',
      adminEmailAdress: 'admin@EmailAdress',
      postQueue: [],
      services: {
        logger: fakeLogger,
        mailService,
      },
    });
  });
});
