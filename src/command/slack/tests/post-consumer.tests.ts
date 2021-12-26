import { fakeLogger } from '@services/fake/logging-service';
import { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import type { PostWithScreenshot } from '../../post-manager/producer';
import { PostConsumerForSlack } from '../post-consumer';
import type { ISlackService } from '@services/slack-service';

describe('PostConsumerForSlack', () => {
  const mockPostMessage = jest.fn();
  const fakeSlackService: ISlackService = {
    postSimpleMessage: mockPostMessage,
  };

  const consumer = new PostConsumerForSlack(
    {
      logger: fakeLogger,
      slackService: fakeSlackService,
    },
    '#channel',
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
    mockPostMessage.mockRestore();
  });

  it('does nothing if queue is empty', async () => {
    await consumer.consume([]);
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('does nothing if none of the post contains screenshot', async () => {
    const queue = new Array(4).fill(postWithoutScreenshot);
    await consumer.consume(queue);
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  describe('when message can be sent', () => {
    beforeEach(() => {
      mockPostMessage.mockResolvedValue(Result.ok(null));
    });

    it('take one from the queue only', async () => {
      const queue = new Array(4).fill(postWithScreenshot);
      await consumer.consume(queue);
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
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
      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: '#channel',
        abstract: 'title-2',
        text: 'content-2',
        image: {
          content: Buffer.from('fake-screenshot'),
          filename: 'screenshot.1.png',
        },
      });
    });
  });

  describe('when slack message can not be sent', () => {
    it('will kick post back to queue', async () => {
      mockPostMessage.mockResolvedValue(Result.err(null));

      const queue = [postWithScreenshot];
      const p = consumer.consume(queue);
      expect(queue.length).toEqual(0);
      await p;
      expect(queue.length).toEqual(1);
      expect(mockPostMessage).toHaveBeenCalled();
    });
  });
});
