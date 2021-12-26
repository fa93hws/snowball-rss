import { fakeLogger } from '@services/fake/logging-service';
import type { ILogger } from '@services/logging-service';
import type { IMailService } from '@services/notification/mail-service';
import type { ISlackService } from '@services/slack-service';
import { Result } from '@utils/result';
import * as path from 'path';
import { EOL } from 'os';
import { EmailCrashService, SlackCrashService } from '../crash-service';

describe('EmailCrashService', () => {
  const fakeSendMail = jest.fn();
  const mailService: IMailService = {
    send: fakeSendMail,
  };
  const logger: ILogger = {
    ...fakeLogger,
    logFileDirname: path.join(__dirname, 'fixtures', 'crash-logs'),
    logFileName: 'crash.txt',
  };

  it('sends crash reports and attach log file to admin', async () => {
    const mockedExit = jest
      .spyOn(process, 'exit')
      .mockImplementationOnce(() => undefined as any as never);
    const service = new EmailCrashService(
      {
        logger,
        mailService,
      },
      'wjun0912@gmail.com',
    );
    await service.crash('by accident');
    expect(fakeSendMail).toHaveBeenCalledWith({
      to: 'wjun0912@gmail.com',
      subject: 'crash report for snowball-rss',
      text: 'by accident',
      attachments: [
        {
          filename: 'error.log',
          content: Buffer.from('I crashed!'),
        },
      ],
    });
    expect(mockedExit).toHaveBeenCalledWith(1);
    mockedExit.mockRestore();
  });
});

describe('SlackCrashService', () => {
  const fakeSendSlackMessage = jest.fn().mockResolvedValueOnce(Result.ok(1));
  const slackService: ISlackService = {
    postSimpleMessage: fakeSendSlackMessage,
  };

  it('sends crash reason', async () => {
    const mockedExit = jest
      .spyOn(process, 'exit')
      .mockImplementationOnce(() => undefined as any as never);
    const service = new SlackCrashService(
      {
        logger: fakeLogger,
        slackService,
      },
      '#channel',
    );
    await service.crash('by accident');
    expect(fakeSendSlackMessage).toHaveBeenCalledWith({
      channel: '#channel',
      text: ['*[fatal] service down*', '_reason_: ', '', '```', 'by accident', '```'].join(EOL),
    });
    expect(mockedExit).toHaveBeenCalledWith(1);
    mockedExit.mockRestore();
  });
});
