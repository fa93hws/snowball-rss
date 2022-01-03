import { fakeLogger } from '@services/fake/logging-service';
import { Result } from '@utils/result';
import { DiscordService } from '../discord-service';

describe('DiscordService', () => {
  const fakeLogin = jest.fn();
  const fakeDestroy = jest.fn();
  const fakeFetchChannel = jest.fn();
  const fakeChannelCache = new Map<string, any>();
  const fakeClient = () => ({
    login: fakeLogin,
    destroy: fakeDestroy,
    channels: { fetch: fakeFetchChannel, cache: fakeChannelCache },
  });
  const service = new DiscordService({ logger: fakeLogger }, fakeClient as any);

  describe('login', () => {
    it('should login', async () => {
      fakeLogin.mockResolvedValueOnce(undefined);
      const result = await service.login('token');
      expect(result).toEqual(Result.ok(1));
      expect(fakeLogin).toHaveBeenCalledWith('token');
    });

    it('failes login if got error', async () => {
      const e = new Error('error');
      fakeLogin.mockRejectedValueOnce(e);
      const result = await service.login('token');
      expect(result).toEqual(Result.err(new Error(`failed to login, ${e}`)));
      expect(fakeLogin).toHaveBeenCalledWith('token');
    });
  });

  describe('logout', () => {
    it('calls destroy when log out', () => {
      service.logout();
      expect(fakeDestroy).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    describe('no cache', () => {
      it('sends message without files', async () => {
        const fakeSend = jest.fn();
        const fakeChannel = {
          type: 'GUILD_TEXT',
          send: fakeSend,
        };
        fakeFetchChannel.mockResolvedValueOnce(fakeChannel);
        const res = await service.sendMessage('channelId', 'message', []);
        expect(fakeFetchChannel).toHaveBeenCalledWith('channelId', { cache: true });
        expect(fakeSend).toHaveBeenCalledWith({ content: 'message', files: [] });
        expect(res).toEqual(Result.ok(1));
      });

      it('sends message with files', async () => {
        const fakeSend = jest.fn();
        const fakeChannel = {
          type: 'GUILD_TEXT',
          send: fakeSend,
        };
        fakeFetchChannel.mockResolvedValueOnce(fakeChannel);
        const res = await service.sendMessage('channelId', 'message', [
          Buffer.from('a'),
          Buffer.from('b'),
          Buffer.from('c'),
        ]);
        expect(fakeFetchChannel).toHaveBeenCalledWith('channelId', { cache: true });
        expect(fakeSend).toHaveBeenCalledWith({
          content: 'message',
          files: [
            {
              attachment: Buffer.from('a'),
            },
            {
              attachment: Buffer.from('b'),
            },
            {
              attachment: Buffer.from('c'),
            },
          ],
        });
        expect(res).toEqual(Result.ok(1));
      });

      it('failed to send message if channel not found', async () => {
        fakeFetchChannel.mockResolvedValueOnce(undefined);
        const res = await service.sendMessage('channelId', 'message', []);
        expect(fakeFetchChannel).toHaveBeenCalledWith('channelId', { cache: true });
        expect(() => Result.unwrap(res)).toThrowError('channel not found');
      });

      it('failed to send message if channel is not a text message', async () => {
        fakeFetchChannel.mockResolvedValueOnce({ type: 'something' });
        const res = await service.sendMessage('channelId', 'message', []);
        expect(fakeFetchChannel).toHaveBeenCalledWith('channelId', { cache: true });
        expect(() => Result.unwrap(res)).toThrowError('text channel');
      });
    });

    describe('with cache', () => {
      it('sends message without files', async () => {
        const fakeSend = jest.fn();
        const fakeChannel = {
          type: 'GUILD_TEXT',
          send: fakeSend,
        };
        fakeChannelCache.set('channelId', fakeChannel);
        const res = await service.sendMessage('channelId', 'message', []);
        expect(fakeFetchChannel).not.toHaveBeenCalled();
        expect(fakeSend).toHaveBeenCalledWith({ content: 'message', files: [] });
        expect(res).toEqual(Result.ok(1));
      });

      it('will try to fetch channel if channel not found', async () => {
        fakeChannelCache.set('channelId', undefined);
        fakeFetchChannel.mockResolvedValueOnce(undefined);
        const res = await service.sendMessage('channelId', 'message', []);
        expect(fakeFetchChannel).toHaveBeenCalledWith('channelId', { cache: true });
        expect(() => Result.unwrap(res)).toThrowError('channel not found');
      });

      it('failed to send message if channel is not a text message', async () => {
        const fakeChannel = {
          type: 'some_other_type',
        };
        fakeChannelCache.set('channelId', fakeChannel);
        const res = await service.sendMessage('channelId', 'message', []);
        expect(fakeFetchChannel).not.toHaveBeenCalled();
        expect(() => Result.unwrap(res)).toThrowError('text channel');
      });
    });
  });

  afterEach(() => {
    fakeLogin.mockRestore();
    fakeDestroy.mockRestore();
    fakeFetchChannel.mockRestore();
    fakeChannelCache.clear();
  });
});
