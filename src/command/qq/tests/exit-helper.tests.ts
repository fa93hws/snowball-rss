import { fakeLogger } from '@services/fake/logging-service';
import type { IHttpService } from '@services/https-service';
import { Result } from '@utils/result';
import { ExitHelper } from '../exit-helper';

describe('SlackCrashService', () => {
  const fakeGet = jest.fn();
  const fakeHttpService: IHttpService = {
    get: fakeGet,
  };
  const fakeLogError = jest.fn();
  const exitHelper = new ExitHelper({
    httpService: fakeHttpService,
    logger: {
      ...fakeLogger,
      error: fakeLogError,
    },
    account: 123456,
    qmsgToken: 'qmsg-token',
  });

  const mockedExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as any as never);

  it('sends crash message', async () => {
    fakeGet.mockResolvedValueOnce(Result.ok({}));
    await exitHelper.onUnexpectedExit();
    expect(fakeGet).toHaveBeenCalledWith(
      `https://qmsg.zendee.cn/send/qmsg-token?msg=${encodeURIComponent(
        '非正常服务下线',
      )}1-2-3-4-5-6`,
    );
    expect(mockedExit).toHaveBeenCalledWith(1);
  });

  it('log error if failed to send crash message', async () => {
    fakeGet.mockResolvedValueOnce(Result.err('error-1'));
    await exitHelper.onUnexpectedExit();
    expect(fakeLogError).toHaveBeenCalledWith('error-1');
  });

  it('sends message on expected exit', async () => {
    fakeGet.mockResolvedValueOnce(Result.ok({}));
    await exitHelper.onExpectedExit();
    expect(fakeGet).toHaveBeenCalledWith(
      `https://qmsg.zendee.cn/send/qmsg-token?msg=${encodeURIComponent('服务下线')}1-2-3-4-5-6`,
    );
    expect(mockedExit).toHaveBeenCalledWith(1);
  });

  it('log error if failed to send message on expected exit', async () => {
    fakeGet.mockResolvedValueOnce(Result.err('error-2'));
    await exitHelper.onExpectedExit();
    expect(fakeLogError).toHaveBeenCalledWith('error-2');
  });

  afterEach(() => {
    fakeGet.mockRestore();
    mockedExit.mockClear();
    fakeLogError.mockClear();
  });

  afterAll(() => {
    mockedExit.mockRestore();
  });
});
