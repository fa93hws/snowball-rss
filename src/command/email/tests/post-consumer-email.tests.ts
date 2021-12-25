import { fakeLogger } from '@services/fake/logging-service';
import { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import type { IMailService } from '@services/notification/mail-service';
import type { PostWithScreenshot } from '../../post-manager/producer';
import { PostConsumerForEmail } from '../post-consumer-email';

describe('PostConsumerForEmail', () => {
  const mockSendMail = jest.fn();
  const fakeMailService: IMailService = {
    send: mockSendMail,
  };
  const subscribers: string[] = ['user-a@service-a.com', 'user-b@service-b.com'];

  const consumer = new PostConsumerForEmail(
    {
      logger: fakeLogger,
      mailService: fakeMailService,
    },
    subscribers,
  );

  const date = new Date();
  const postWithoutScreenshot = new Post('title-1', 'content-1', date, 'post_url-1');
  const postWithScreenshot: PostWithScreenshot = {
    ...new Post('title-2', 'content-2', date, 'post_url-2'),
    screenshot: {
      content: Buffer.from('fake-screenshot'),
      triedTimes: 1,
    },
  };

  afterEach(() => {
    mockSendMail.mockRestore();
  });

  it('does nothing if queue is empty', async () => {
    await consumer.consume([]);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('does nothing if none of the post contains screenshot', async () => {
    const queue = new Array(4).fill(postWithoutScreenshot);
    await consumer.consume(queue);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  describe('when email can be sent', () => {
    beforeEach(() => {
      mockSendMail.mockResolvedValue(Result.ok(null));
    });

    it('take one from the queue only', async () => {
      const queue = new Array(4).fill(postWithScreenshot);
      await consumer.consume(queue);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(queue.length).toEqual(3);
    });

    it('take first post to given format with attachments', async () => {
      await consumer.consume([
        postWithoutScreenshot,
        postWithoutScreenshot,
        postWithScreenshot,
        postWithoutScreenshot,
        postWithoutScreenshot,
      ]);
      expect(mockSendMail).toHaveBeenCalledWith({
        subject: 'Subscribed message from snowball-rss',
        to: 'user-a@service-a.com, user-b@service-b.com',
        text: [
          'Title:',
          'title-2',
          '',
          '',
          'Body:',
          'content-2',
          '',
          '',
          `Published at: ${date}`,
          `link: post_url-2`,
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
  });

  describe('when email can not be sent', () => {
    it('will kick post back to queue', async () => {
      mockSendMail.mockResolvedValue(Result.err(null));

      const queue = [postWithScreenshot];
      const p = consumer.consume(queue);
      expect(queue.length).toEqual(0);
      await p;
      expect(queue.length).toEqual(1);
      expect(mockSendMail).toHaveBeenCalled();
    });
  });
});
