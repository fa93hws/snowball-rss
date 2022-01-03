import type { IDiscordService } from '@services/discord-service';
import { Result } from '@utils/result';
import { ExitHelper } from '../exit-helper';
import { EOL } from 'os';

describe('SlackCrashService', () => {
  const fakeSendMsg = jest.fn();
  const fakeLogout = jest.fn();
  const fakeDiscordService: IDiscordService = {
    sendMessage: fakeSendMsg,
    login: jest.fn(),
    logout: fakeLogout,
  };
  const fakeLogError = jest.fn();
  const exitHelper = new ExitHelper({
    discordService: fakeDiscordService,
    discordChannelId: 'channel',
    account: 123456,
  });

  const mockedExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as any as never);

  it('sends crash message', async () => {
    fakeSendMsg.mockResolvedValueOnce(Result.ok({}));
    await exitHelper.onUnexpectedExit('reason');
    expect(fakeSendMsg).toHaveBeenCalledWith(
      'channel',
      ['服务出错(unexpected)', 'QQ账号: 123456', '错误原因: reason'].join(EOL),
    );
    expect(mockedExit).toHaveBeenCalledWith(1);
    expect(fakeLogout).toHaveBeenCalled();
  });

  it('sends message on expected exit', async () => {
    fakeSendMsg.mockResolvedValueOnce(Result.ok({}));
    await exitHelper.onExpectedExit('reason');
    expect(fakeSendMsg).toHaveBeenCalledWith(
      'channel',
      ['服务下线(expected)', 'QQ账号: 123456', '原因: reason'].join(EOL),
    );
    expect(mockedExit).toHaveBeenCalledWith(1);
    expect(fakeLogout).toHaveBeenCalled();
  });

  afterEach(() => {
    fakeSendMsg.mockRestore();
    mockedExit.mockClear();
    fakeLogError.mockClear();
    fakeLogout.mockClear();
  });

  afterAll(() => {
    mockedExit.mockRestore();
  });
});
