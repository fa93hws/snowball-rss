import { fakeLogger } from '@services/fake/logging-service';
import type { ISlackService } from '@services/slack-service';
import { Result } from '@utils/result';
import { EOL } from 'os';
import { ExitHelper } from '../exit-helper';

describe('SlackCrashService', () => {
  const fakeSendSlackMessage = jest.fn().mockResolvedValue(Result.ok(1));
  const slackService: ISlackService = {
    postSimpleMessage: fakeSendSlackMessage,
  };
  const exitHelper = new ExitHelper(
    {
      logger: fakeLogger,
      slackService,
    },
    '#channel',
  );
  const mockedExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as any as never);

  it('sends crash reason', async () => {
    await exitHelper.onUnexpectedExit('by accident');
    expect(fakeSendSlackMessage).toHaveBeenCalledWith({
      channel: '#channel',
      abstract: '[致命的错误] 无法继续运行',
      text: ['*[fatal] service down*', '_reason_: ', '', '```', 'by accident', '```'].join(EOL),
    });
    expect(mockedExit).toHaveBeenCalledWith(1);
  });

  it('sends service down when expected', async () => {
    await exitHelper.onExpectedExit('expected');
    expect(fakeSendSlackMessage).toHaveBeenCalledWith({
      channel: '#channel',
      abstract: 'Service down',
      text: 'Service down, due to expected',
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
