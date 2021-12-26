import { fakeLogger } from '@services/fake/logging-service';
import { Result } from '@utils/result';
import { SlackService } from '../slack-service';

describe('SlackService', () => {
  const botUserToken = 'botUserToken';
  const userToken = 'userToken';

  function createService(params: {
    fakeConstructor?: jest.Mock;
    fakeFileUpload?: jest.Mock;
    fakeFileShare?: jest.Mock;
    fakePostMessage?: jest.Mock;
  }) {
    const fakeConstructor = params.fakeConstructor ?? jest.fn();
    const fakeFileUpload = params.fakeFileUpload ?? jest.fn();
    const fakeFileShare = params.fakeFileShare ?? jest.fn();
    const fakePostMessage = params.fakePostMessage ?? jest.fn();
    class FakeWebClient {
      constructor(...options: any[]) {
        fakeConstructor(...options);
      }
      readonly files = {
        upload: (...options: any[]) => fakeFileUpload(...options),
        sharedPublicURL: (...options: any[]) => fakeFileShare(...options),
      };

      readonly chat = {
        postMessage: (...options: any[]) => fakePostMessage(...options),
      };
    }
    return new SlackService(
      { botUserToken, userToken, logger: fakeLogger },
      {
        WebClient: FakeWebClient as any,
      },
    );
  }

  it('is constructed with proper options', () => {
    const fakeConstructor = jest.fn();
    createService({ fakeConstructor });
    expect(fakeConstructor).toHaveBeenCalledWith(botUserToken, {
      retryConfig: {
        retries: 5,
        minTimeout: 1 * 1000,
        maxRetryTime: 60 * 1000,
      },
    });
  });

  describe('with image', () => {
    const postMessageParams = {
      channel: '#channel',
      text: '**some-text**',
      image: {
        content: Buffer.from('fake-screenshot'),
        filename: 'screenshot.png',
      },
    };
    const fakeSuccessFileUpload = jest.fn().mockResolvedValue({
      ok: true,
      file: { id: 'fileId' },
    });
    const fakeSuccessFileShare = jest.fn().mockResolvedValue({
      ok: true,
      file: {
        permalink_public: 'permalink_public-public_secret',
        url_private: 'url_private',
      },
    });
    const fakePostSuccessMessage = jest.fn().mockResolvedValue({ ok: true });

    it('posts message with image to slack', async () => {
      const fakeFileUpload = fakeSuccessFileUpload;
      const fakeFileShare = fakeSuccessFileShare;
      const fakePostMessage = fakePostSuccessMessage;
      const service = createService({
        fakeFileUpload,
        fakeFileShare,
        fakePostMessage,
      });
      const result = await service.postSimpleMessage(postMessageParams);
      expect(result).toEqual(Result.ok(1));
      expect(fakeFileUpload).toHaveBeenCalledWith({
        file: Buffer.from('fake-screenshot'),
        filename: 'screenshot.png',
        token: userToken,
      });
      expect(fakeFileShare).toHaveBeenCalledWith({
        file: 'fileId',
        token: userToken,
      });
      expect(fakePostMessage).toHaveBeenCalledWith({
        channel: '#channel',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '**some-text**',
            },
          },
          {
            type: 'image',
            title: {
              type: 'plain_text',
              text: 'screenshot.png',
            },
            image_url: 'url_private?pub_secret=public_secret',
            alt_text: 'screenshot.png',
          },
        ],
      });
    });

    describe('failed to get response', () => {
      it('fails with uploading', async () => {
        const fakeFileUpload = jest.fn().mockRejectedValue('uploading error');
        const service = createService({ fakeFileUpload });
        const postMessageResult = await service.postSimpleMessage(postMessageParams);
        expect(postMessageResult).toEqual(Result.err('uploading error'));
      });

      it('fails with sharing image', async () => {
        const fakeFileUpload = fakeSuccessFileUpload;
        const fakeFileShare = jest.fn().mockRejectedValueOnce('sharing error');
        const service = createService({ fakeFileUpload, fakeFileShare });
        const postMessageResult = await service.postSimpleMessage(postMessageParams);
        expect(postMessageResult).toEqual(Result.err('sharing error'));
      });

      it('fails with posting message', async () => {
        const fakeFileUpload = fakeSuccessFileUpload;
        const fakeFileShare = fakeSuccessFileShare;
        const fakePostMessage = jest.fn().mockRejectedValueOnce('posting error');
        const service = createService({ fakeFileUpload, fakeFileShare, fakePostMessage });
        const postMessageResult = await service.postSimpleMessage(postMessageParams);
        expect(postMessageResult).toEqual(Result.err('posting error'));
      });
    });

    describe('get error response', () => {
      it('fails with uploading', async () => {
        const fakeFileUpload = jest.fn().mockResolvedValue({
          ok: false,
          error: 'some-file-upload-error',
        });
        const service = createService({
          fakeFileUpload,
        });
        const result = await service.postSimpleMessage(postMessageParams);
        expect(() => Result.unwrap(result)).toThrowError('some-file-upload-error');
      });

      it('fails with sharing image', async () => {
        const fakeFileUpload = fakeSuccessFileUpload;
        const fakeFileShare = jest.fn().mockResolvedValue({
          ok: false,
          error: 'some-file-share-error',
        });
        const service = createService({
          fakeFileUpload,
          fakeFileShare,
        });
        const result = await service.postSimpleMessage(postMessageParams);
        expect(() => Result.unwrap(result)).toThrowError('some-file-share-error');
      });

      it('fails with sharing image because of receiving link is not in correct format', async () => {
        const fakeFileUpload = fakeSuccessFileUpload;
        const fakeFileShare = jest.fn().mockResolvedValue({
          ok: true,
          file: {
            permalink_public: 'permalink_public',
            url_private: 'url_private',
          },
        });
        const fakePostMessage = jest.fn();
        const service = createService({
          fakeFileUpload,
          fakeFileShare,
        });
        const result = await service.postSimpleMessage(postMessageParams);
        expect(fakePostMessage).not.toHaveBeenCalled();
        expect(() => Result.unwrap(result)).toThrowError('wrong permalink_public format');
      });

      it('fails with sharing image because of permalink_public is missing in response', async () => {
        const fakeFileUpload = fakeSuccessFileUpload;
        const fakeFileShare = jest.fn().mockResolvedValue({
          ok: true,
          file: { url_private: 'url_private' },
        });
        const fakePostMessage = jest.fn();
        const service = createService({
          fakeFileUpload,
          fakeFileShare,
        });
        const result = await service.postSimpleMessage(postMessageParams);
        expect(fakePostMessage).not.toHaveBeenCalled();
        expect(() => Result.unwrap(result)).toThrowError('permalink_public');
      });

      it('fails with posting message', async () => {
        const fakeFileUpload = fakeSuccessFileUpload;
        const fakeFileShare = fakeSuccessFileShare;
        const fakePostMessage = jest.fn().mockResolvedValue({
          ok: false,
          error: 'some-posting-message-error',
        });
        const service = createService({
          fakeFileUpload,
          fakeFileShare,
          fakePostMessage,
        });
        const result = await service.postSimpleMessage(postMessageParams);
        expect(() => Result.unwrap(result)).toThrowError('some-posting-message-error');
      });
    });

    afterEach(() => {
      fakeSuccessFileUpload.mockClear();
      fakeSuccessFileShare.mockClear();
      fakePostSuccessMessage.mockClear();
    });
  });

  describe('without image', () => {
    it('posts plain text message to slack', async () => {
      const fakePostMessage = jest.fn().mockResolvedValueOnce({
        ok: true,
      });
      const service = createService({ fakePostMessage });
      const postMessageResult = await service.postSimpleMessage({
        channel: '#the-channel',
        text: '**text**',
      });
      expect(postMessageResult).toMatchObject({ isOk: true });
      expect(fakePostMessage).toHaveBeenCalledWith({
        channel: '#the-channel',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '**text**',
            },
          },
        ],
      });
    });

    it('failed to post message because of receiving error response', async () => {
      const fakePostMessage = jest.fn().mockResolvedValueOnce({
        ok: false,
      });
      const service = createService({ fakePostMessage });
      const postMessageResult = await service.postSimpleMessage({
        channel: '#the-channel',
        text: '**text**',
      });
      expect(postMessageResult).toMatchObject({ isOk: false });
    });

    it('failed to post message because of not receiving response', async () => {
      const fakePostMessage = jest.fn().mockRejectedValueOnce('network error!');
      const service = createService({ fakePostMessage });
      const postMessageResult = await service.postSimpleMessage({
        channel: '#the-channel',
        text: '**text**',
      });
      expect(postMessageResult).toEqual(Result.err('network error!'));
    });
  });
});
