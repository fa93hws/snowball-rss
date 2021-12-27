import { fakeLogger } from '@services/fake/logging-service';
import { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import type { PostWithScreenshot } from '../../post-manager/producer';
import { PostConsumer } from '../consumer';

describe('PostConsumer', () => {
  const hanlder = jest.fn();
  const postConsumer = new PostConsumer(fakeLogger, hanlder);

  const date = new Date();
  const postWithoutScreenshot = new Post('title-1', 'content-1', date, 'post_url-1', 'author');
  const postWithScreenshot: PostWithScreenshot = {
    ...new Post('title-2', 'content-2', date, 'post_url-2', 'author'),
    screenshot: {
      content: Buffer.from('fake-screenshot'),
      triedTimes: 1,
    },
  };

  afterEach(() => {
    hanlder.mockRestore();
  });

  it('does nothing if queue is empty', async () => {
    await postConsumer.consumeOne([]);
    expect(hanlder).not.toHaveBeenCalled();
  });

  it('does nothing if none of the post contains screenshot', async () => {
    const queue = new Array(4).fill(postWithoutScreenshot);
    await postConsumer.consumeOne(queue);
    expect(hanlder).not.toHaveBeenCalled();
  });

  describe('when handler gives ok result', () => {
    beforeEach(() => {
      hanlder.mockResolvedValue(Result.ok(null));
    });

    it('take one from the queue only', async () => {
      const queue = new Array(4).fill(postWithScreenshot);
      await postConsumer.consumeOne(queue);
      expect(hanlder).toHaveBeenCalledTimes(1);
      expect(queue.length).toEqual(3);
    });

    it('take first post with screenshot to handler', async () => {
      await postConsumer.consumeOne([
        postWithoutScreenshot,
        postWithoutScreenshot,
        postWithScreenshot,
        postWithoutScreenshot,
        postWithoutScreenshot,
      ]);
      expect(hanlder).toHaveBeenCalledWith(
        postWithScreenshot,
        postWithScreenshot.screenshot?.content,
      );
    });
  });

  describe('when handler gives error result', () => {
    it('will kick post back to queue', async () => {
      hanlder.mockResolvedValue(Result.err(null));

      const queue = [postWithScreenshot];
      const p = postConsumer.consumeOne(queue);
      expect(queue.length).toEqual(0);
      await p;
      expect(queue.length).toEqual(1);
      expect(hanlder).toHaveBeenCalled();
    });
  });
});
