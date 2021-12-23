import { fakeLogger } from '@services/fake/logging-service';
import type { IScreenShotService } from '@services/screenshot-service';
import { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import { PostConsumerForEmail } from '../post-consumer-email';
import type { IMailService } from '@services/mail-service';

describe('PostConsumerForEmail', () => {
  const mockCapture = jest.fn();
  const fakeScreenShotService: IScreenShotService = {
    capturePage: mockCapture,
  };

  const mockSendMail = jest.fn();
  const fakeMailService: IMailService = {
    send: mockSendMail,
  };
  const subscribers: string[] = ['user-a@service-a.com', 'user-b@service-b.com'];

  const consumer = new PostConsumerForEmail({
    logger: fakeLogger,
    screenshotService: fakeScreenShotService,
    mailService: fakeMailService,
  });

  const date = new Date();
  const post = new Post('title', 'content', date, 'post_url');

  afterEach(() => {
    mockCapture.mockRestore();
    mockSendMail.mockRestore();
  });

  it('does nothing if queue is empty', async () => {
    await consumer.consume([], subscribers);
    expect(mockCapture).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  describe('when email can be sent', () => {
    beforeEach(() => {
      mockSendMail.mockResolvedValue(Result.ok(null));
    });

    it('take one from the queue only', async () => {
      mockCapture.mockResolvedValueOnce(Result.ok(Buffer.from('fake-screenshot')));
      const queue = new Array(4).fill(post);
      await consumer.consume(queue, subscribers);
      expect(mockCapture).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalled();
      expect(queue.length).toEqual(3);
    });

    it('convert post to given format with attachments', async () => {
      mockCapture.mockResolvedValueOnce(Result.ok(Buffer.from('fake-screenshot')));
      await consumer.consume([post], subscribers);
      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(mockCapture).toHaveBeenCalledWith('post_url');
      expect(mockSendMail).toHaveBeenCalledWith({
        subject: 'Subscribed message from snowball-rss',
        to: 'user-a@service-a.com, user-b@service-b.com',
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
      await consumer.consume([post], subscribers);
      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(mockCapture).toHaveBeenCalledWith('post_url');
      expect(mockSendMail).toHaveBeenCalledWith({
        subject: 'Subscribed message from snowball-rss',
        to: 'user-a@service-a.com, user-b@service-b.com',
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

    it('send email anyway if the screen shot can not be taken, and warn user', async () => {
      mockCapture.mockResolvedValueOnce(Result.err('err'));
      const mockWarn = jest.fn();
      jest.spyOn(fakeLogger, 'warn').mockImplementationOnce(mockWarn);
      await consumer.consume([post], subscribers);
      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(mockCapture).toHaveBeenCalledWith('post_url');
      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith({
        subject: 'Subscribed message from snowball-rss',
        to: 'user-a@service-a.com, user-b@service-b.com',
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
  });

  describe('when email can not be sent', () => {
    it('will kick post back to queue', async () => {
      mockSendMail.mockResolvedValue(Result.err(null));
      mockCapture.mockResolvedValueOnce(Result.err('err'));

      const queue = [post];
      const p = consumer.consume(queue, subscribers);
      expect(queue.length).toEqual(0);
      await p;
      expect(queue.length).toEqual(1);
      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(mockCapture).toHaveBeenCalledWith('post_url');
      expect(mockSendMail).toHaveBeenCalled();
    });
  });
});
