import { fakeLogger } from '@services/fake/logging-service';
import type { ILogger } from '@services/logging-service';
import type { IMailService } from '@services/notification/mail-service';
import path from 'path';
import { ExitHelper } from '../exit-helper';

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
  const exitHelper = new ExitHelper(
    {
      logger,
      mailService,
    },
    'wjun0912@gmail.com',
  );
  const mockedExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as any as never);

  it('sends crash reports and attach log file to admin', async () => {
    await exitHelper.onUnexpectedExit('by accident');
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
  });

  it('sends email reports with expected exit', async () => {
    await exitHelper.onExpectedExit('expected');
    expect(fakeSendMail).toHaveBeenCalledWith({
      to: 'wjun0912@gmail.com',
      subject: 'service down',
      text: 'expected',
    });
    expect(mockedExit).toHaveBeenCalledWith(1);
  });

  afterEach(() => {
    mockedExit.mockClear();
  });

  afterAll(() => {
    mockedExit.mockRestore();
  });
});
