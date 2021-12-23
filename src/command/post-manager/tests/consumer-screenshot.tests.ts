import { fakeLogger } from '@services/fake/logging-service';
import { Post } from '@services/rss/snowball/message';
import type { IScreenShotService } from '@services/screenshot-service';
import { Result } from '@utils/result';
import { PostConsumerScreenshot } from '../consumer-screenshot';
import type { PostWithScreenshot } from '../producer';

function createPosts(n: number): PostWithScreenshot[] {
  return new Array(n)
    .fill(0)
    .map((_, idx) => new Post('title', 'content', new Date(0), `post_url_${idx}`));
}

describe('PostConsumerScreenshot', () => {
  const mockCapture = jest.fn();
  const fakeScreenShotService: IScreenShotService = {
    capturePage: mockCapture,
  };

  const consumer = new PostConsumerScreenshot({
    screenshotService: fakeScreenShotService,
    logger: fakeLogger,
  });

  it('do nothing if all item in the queue has screenshot already', async () => {
    const posts = createPosts(4);
    posts.forEach((post) => {
      post.screenshot = { content: Buffer.from('fake-screenshot'), triedTimes: 1 };
    });
    await consumer.consume(posts);
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('take screenshot for each item in the queue', async () => {
    mockCapture.mockImplementation((url: string) => Result.ok(Buffer.from(`from ${url}`)));
    const posts = createPosts(4);
    const originalPosts = createPosts(4);
    await consumer.consume(posts);
    expect(mockCapture).toHaveBeenCalledTimes(4);
    expect(posts).toEqual(
      originalPosts.map((p) => ({
        ...p,
        screenshot: { content: Buffer.from(`from ${p.link}`), triedTimes: 1 },
      })),
    );
  });

  it('will not assign content if screenshot failed', async () => {
    mockCapture.mockImplementation((url: string) => {
      return url !== 'post_url_1'
        ? Result.ok(Buffer.from(`from ${url}`))
        : Result.err('fake error');
    });
    const posts = createPosts(4);
    const originalPosts = createPosts(4);
    await consumer.consume(posts);
    expect(mockCapture).toHaveBeenCalledTimes(4);
    expect(posts).toEqual(
      originalPosts.map((p, idx) => ({
        ...p,
        screenshot: {
          content: idx !== 1 ? Buffer.from(`from ${p.link}`) : undefined,
          triedTimes: 1,
        },
      })),
    );
  });

  afterEach(() => {
    mockCapture.mockRestore();
  });
});
