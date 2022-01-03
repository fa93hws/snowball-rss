import { fakeLogger } from '@services/fake/logging-service';
import { QQService } from '@services/qq-service';
import { Result } from '@utils/result';
import * as oicq from 'oicq';
import type { Client } from 'oicq';
import type { IExitHelper } from '@services/exit-helper';

describe('QQService', () => {
  const fakeListener = jest.fn();
  const fakeLogin = jest.fn();
  const fakeSendMsg = jest.fn();
  const fakeUser = {
    sendMsg: fakeSendMsg,
  };
  const fakeGroup = {
    sendMsg: fakeSendMsg,
  };
  const fakeClient: Client = {
    on: fakeListener,
    login: fakeLogin,
    fl: new Map([[123, {}]]),
    gl: new Map([[123, {}]]),
    pickFriend: () => fakeUser,
    pickGroup: () => fakeGroup,
  } as any;
  const fakeExit = jest.fn();
  const exitHelper: IExitHelper = {
    onUnexpectedExit: fakeExit,
    onExpectedExit: jest.fn(),
  };

  const fakeStdin = jest
    .spyOn(process.stdin, 'once')
    .mockImplementationOnce((_: string, callback: () => any) => {
      return callback();
    });
  const fakeCreateClient = jest.spyOn(oicq, 'createClient').mockReturnValue(fakeClient);

  const createQQService = () =>
    new QQService({
      account: 12345,
      logger: fakeLogger,
      exitHelper,
    });

  describe('login', () => {
    beforeAll(() => {
      fakeListener.mockImplementation((_: string, cb: () => any) => {
        cb.call(fakeClient);
        return fakeClient;
      });
    });

    it('use qr code to login if password is empty', async () => {
      const service = createQQService();
      const result = await service.login();
      expect(result).toEqual(Result.ok(1));
      expect(fakeLogin).toHaveBeenCalled();
      expect(fakeListener).toHaveBeenCalledWith('system.login.qrcode', expect.anything());
      expect(fakeListener).toHaveBeenCalledWith('system.online', expect.anything());
      fakeStdin.mockRestore();
    });

    it('use password to login if password is given', async () => {
      const service = createQQService();
      const result = await service.login('pass');
      expect(result).toEqual(Result.ok(1));
      expect(fakeLogin).toHaveBeenCalledWith('pass');
      expect(fakeListener).toHaveBeenCalledWith('system.online', expect.anything());
    });

    it('failes to login due to some reason', async () => {
      fakeLogin.mockRejectedValueOnce('abc');
      const service = createQQService();
      const result = await service.login('pass');
      expect(result).toEqual(Result.err('abc'));
    });

    it('exit if logged out', async () => {
      const service = createQQService();
      await service.login('pass');
      expect(fakeListener).toHaveBeenCalledWith('system.offline', expect.anything());
      const cb = fakeListener.mock.calls.filter(([event]) => event === 'system.offline')[0][1];
      cb();
      expect(fakeExit).toHaveBeenCalled();
    });
  });

  describe('sendMessageToUser', () => {
    it('error if not logged in', async () => {
      const service = createQQService();
      const result = await service.sendMessageToUser(123, 'abcd');
      expect(() => Result.unwrap(result)).toThrowError('not logged in');
    });

    it('error if target is not a friend', async () => {
      const service = createQQService();
      await service.login('pass');
      const result = await service.sendMessageToUser(1234, 'abcd');
      expect(() => Result.unwrap(result)).toThrowError('no friend');
    });

    it('managed to send message', async () => {
      const service = createQQService();
      await service.login('pass');
      fakeSendMsg.mockResolvedValueOnce(1);
      const result = await service.sendMessageToUser(123, 'abcd');
      expect(fakeSendMsg).toHaveBeenCalledWith('abcd');
      expect(result).toEqual(Result.ok(1));
    });

    it('error if sending message fails', async () => {
      const service = createQQService();
      await service.login('pass');
      fakeSendMsg.mockRejectedValueOnce('rejected');
      const result = await service.sendMessageToUser(123, 'abcd');
      expect(result).toEqual(Result.err('rejected'));
    });
  });

  describe('sendMessageToGroup', () => {
    it('error if not logged in', async () => {
      const service = createQQService();
      const result = await service.sendMessageToGroup(123, 'abcd');
      expect(() => Result.unwrap(result)).toThrowError('not logged in');
    });

    it('error if target is not in list', async () => {
      const service = createQQService();
      await service.login('pass');
      const result = await service.sendMessageToGroup(1234, 'abcd');
      expect(() => Result.unwrap(result)).toThrowError('no group');
    });

    it('managed to send message', async () => {
      const service = createQQService();
      await service.login('pass');
      fakeSendMsg.mockResolvedValueOnce(1);
      const result = await service.sendMessageToGroup(123, 'abcd');
      expect(fakeSendMsg).toHaveBeenCalledWith('abcd');
      expect(result).toEqual(Result.ok(1));
    });

    it('error if sending message fails', async () => {
      const service = createQQService();
      await service.login('pass');
      fakeSendMsg.mockRejectedValueOnce('rejected');
      const result = await service.sendMessageToGroup(123, 'abcd');
      expect(result).toEqual(Result.err('rejected'));
    });

    it('uploads image', async () => {
      const service = createQQService();
      await service.login('pass');
      fakeSendMsg.mockResolvedValue(1);
      const result = await service.sendMessageToGroup(123, 'abcd', Buffer.from('image'));
      expect(fakeSendMsg).toHaveBeenCalledWith('abcd');
      expect(fakeSendMsg).toHaveBeenCalledWith(oicq.segment.image(Buffer.from('image')));
      expect(result).toEqual(Result.ok(1));
    });
  });

  afterEach(() => {
    fakeCreateClient.mockClear();
    fakeListener.mockClear();
    fakeExit.mockClear();
    fakeSendMsg.mockRestore();
  });

  afterAll(() => {
    fakeListener.mockRestore();
  });
});
