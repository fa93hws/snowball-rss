import { fakeLogger } from '@services/fake/logging-service';
import type { ILogger } from '@services/logging-service';
import type { IMailService } from '@services/mail-service';
import * as path from 'path';
import { EmailCrashService } from '../crash-service';

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
          filename: 'log.txt',
          content: Buffer.from('I crashed!'),
        },
      ],
    });
    expect(mockedExit).toHaveBeenCalledWith(1);
    mockedExit.mockRestore();
  });
});
