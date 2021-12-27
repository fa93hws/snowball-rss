import { fakeLogger } from '@services/fake/logging-service';
import type { IQQService } from '@services/qq-service';
import { Result } from '@utils/result';
import { EOL } from 'os';
import { ExitHelper } from '../exit-helper';

describe('SlackCrashService', () => {
  const fakeSendMessage = jest.fn().mockResolvedValue(Result.ok(1));
  const qqService: IQQService = {
    sendMessageToGroup: jest.fn(),
    sendMessageToUser: fakeSendMessage,
  };
  const exitHelper = new ExitHelper(qqService, fakeLogger, 123456);
  const mockedExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as any as never);

  it('sends crash reason', async () => {
    await exitHelper.onUnexpectedExit('by accident');
    expect(fakeSendMessage).toHaveBeenCalledWith(123456, '群聊机器人出错了' + EOL + 'by accident');
    expect(mockedExit).toHaveBeenCalledWith(1);
  });

  it('sends service down when expected', async () => {
    await exitHelper.onExpectedExit('expected');
    expect(fakeSendMessage).toHaveBeenCalledWith(123456, 'Service Down due to' + EOL + 'expected');
    expect(mockedExit).toHaveBeenCalledWith(1);
  });

  afterEach(() => {
    mockedExit.mockClear();
  });

  afterAll(() => {
    mockedExit.mockRestore();
  });
});
