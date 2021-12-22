import { fakeLogger } from '@services/fake/logging-service';
import { IScreenShotService } from '@services/screenshot-service';
import { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import { postToMail } from '../convert-post';

describe('postToMail', () => {
  const mockCapture = jest.fn();
  const fakeScreenShotService: IScreenShotService = {
    capturePage: mockCapture,
  };

  beforeEach(() => {
    mockCapture.mockRestore();
  });

  it('convert post to given format with attachments', async () => {
    mockCapture.mockResolvedValueOnce(Result.ok(Buffer.from('fake-screenshot')));
    const date = new Date();
    const post = new Post('title', 'content', date, 'post_url');
    const receivers = ['receiver1', 'receiver2'];
    const mail = await postToMail(post, receivers, fakeLogger, fakeScreenShotService);
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledWith('post_url');
    expect(mail).toEqual({
      subject: 'Subscribed message from snowball-rss',
      to: 'receiver1, receiver2',
      text: [
        'Title:',
        'title',
        '',
        '',
        'Body:',
        'content',
        '',
        '',
        `Published at: ${date}`,
        `link: post_url`,
        '',
        '',
      ].join('\n'),
      attachments: [
        {
          filename: 'screenshot.png',
          content: Buffer.from('fake-screenshot'),
          contentType: 'image/png',
        },
      ],
    });
  });

  it('convert post to given format without attachments if failed to capture screen shot', async () => {
    mockCapture.mockResolvedValueOnce(Result.err('err'));
    const date = new Date();
    const post = new Post('title', 'content', date, 'post_url');
    const receivers = ['receiver1', 'receiver2'];
    const mail = await postToMail(post, receivers, fakeLogger, fakeScreenShotService);
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledWith('post_url');
    expect(mail).toEqual({
      subject: 'Subscribed message from snowball-rss',
      to: 'receiver1, receiver2',
      text: [
        'Title:',
        'title',
        '',
        '',
        'Body:',
        'content',
        '',
        '',
        `Published at: ${date}`,
        `link: post_url`,
        '',
        '',
      ].join('\n'),
    });
  });

  it('warn user if failed to capture screen shot', async () => {
    mockCapture.mockResolvedValueOnce(Result.err('err'));
    const mockWarn = jest.fn();
    jest.spyOn(fakeLogger, 'warn').mockImplementationOnce(mockWarn);
    const date = new Date();
    const post = new Post('title', 'content', date, 'post_url');
    const receivers = ['receiver1', 'receiver2'];
    await postToMail(post, receivers, fakeLogger, fakeScreenShotService);
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledWith('post_url');
    expect(mockWarn).toHaveBeenCalledTimes(1);
  });
});
