import { fakeLogger } from '@services/fake/logging-service';
import type { IRssHubService } from '@services/rss/rsshub-service';
import type { IScreenShotService } from '@services/screenshot-service';
import { Result } from '@utils/result';
import { Post } from '@services/rss/snowball/message';
import type { IExitHelper } from '@services/exit-helper';
import { startProducer } from '../start-producer';
import type { PostWithScreenshot } from '../producer';

async function flushPromises(n: number) {
  for (let i = 0; i < n; i++) {
    await Promise.resolve();
  }
}

describe('startProducer', () => {
  const fakeExitHelper: IExitHelper = {
    onExpectedExit: jest.fn(),
    onUnexpectedExit: jest.fn(),
  };
  const fakeCaptureScreenshot = jest.fn();
  const fakeScreenshotService: IScreenShotService = { capturePage: fakeCaptureScreenshot };
  const fakeRssRequest = jest.fn();
  const fakeRssHubService: IRssHubService = { request: fakeRssRequest, init: jest.fn() };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  test('happy path', async () => {
    // setup fake rsshub service
    const rawItems = new Array(20).fill(0).map((_, i) => ({
      title: 'title-' + i,
      description: 'description-' + i,
      pubDate: new Date(2020, 8, i + 1).toISOString(),
      link: 'link-' + i,
    }));
    const getRawMessageWithoutItem = () => ({
      lastBuildDate: new Date().toISOString(),
      updated: new Date().toISOString(),
      ttl: 5,
      atomlink: 'https://rsshub.app/xueqiu/user/6784593966',
      title: '盛京剑客 的雪球全部动态',
      link: 'https://xueqiu.com/u/6784593966',
      description: '盛京剑客 的雪球全部动态',
    });
    fakeRssRequest.mockResolvedValueOnce({
      ...getRawMessageWithoutItem(),
      item: rawItems.slice(5, 15),
    });
    fakeRssRequest.mockResolvedValueOnce({
      ...getRawMessageWithoutItem(),
      item: [...rawItems.slice(7, 15), rawItems[17], rawItems[18]],
    });
    fakeRssRequest.mockResolvedValueOnce({
      ...getRawMessageWithoutItem(),
      item: rawItems.slice(10, 20),
    });

    // setup fake screenshot service
    fakeCaptureScreenshot.mockImplementation((url) =>
      Result.ok(Buffer.from(`screenshot for ${url}`)),
    );

    const postQueue: PostWithScreenshot[] = [];

    startProducer({
      intervalSecond: 1,
      snowballUserId: 'snowballUserId',
      postQueue,
      services: {
        logger: fakeLogger,
        exitHelper: fakeExitHelper,
        rssHubService: fakeRssHubService,
        screenshotService: fakeScreenshotService,
      },
    });

    // first run, all posts will be regarded as old one
    // no snapshot will be taken
    jest.advanceTimersByTime(1);
    await flushPromises(15);
    expect(fakeRssRequest).toHaveBeenCalledWith('https://rsshub.app/xueqiu/user/snowballUserId');
    expect(fakeCaptureScreenshot).not.toHaveBeenCalled();
    expect(postQueue).toEqual([]);

    fakeRssRequest.mockClear();
    fakeCaptureScreenshot.mockClear();
    // second run, will get 18 and 19 as new posts
    jest.advanceTimersByTime(1001);
    await flushPromises(15);
    expect(fakeRssRequest).toHaveBeenCalledWith('https://rsshub.app/xueqiu/user/snowballUserId');
    expect(fakeCaptureScreenshot).toHaveBeenCalledTimes(2);
    expect(fakeCaptureScreenshot).toHaveBeenCalledWith('link-17');
    expect(fakeCaptureScreenshot).toHaveBeenCalledWith('link-18');
    expect(postQueue.sort((a, b) => a.publishedTime.getTime() - b.publishedTime.getTime())).toEqual(
      [
        {
          ...new Post('title-17', 'description-17', new Date(2020, 8, 18), 'link-17'),
          screenshot: {
            content: Buffer.from('screenshot for link-17'),
            triedTimes: 1,
          },
        },
        {
          ...new Post('title-18', 'description-18', new Date(2020, 8, 19), 'link-18'),
          screenshot: {
            content: Buffer.from('screenshot for link-18'),
            triedTimes: 1,
          },
        },
      ],
    );

    fakeRssRequest.mockClear();
    fakeCaptureScreenshot.mockClear();
    // third run, will get 15, 16 and 19 as new posts
    jest.advanceTimersByTime(1001);
    await flushPromises(15);
    expect(fakeRssRequest).toHaveBeenCalledWith('https://rsshub.app/xueqiu/user/snowballUserId');
    expect(fakeCaptureScreenshot).toHaveBeenCalledTimes(3);
    expect(fakeCaptureScreenshot).toHaveBeenCalledWith('link-15');
    expect(fakeCaptureScreenshot).toHaveBeenCalledWith('link-16');
    expect(fakeCaptureScreenshot).toHaveBeenCalledWith('link-19');
    expect(postQueue.sort((a, b) => a.publishedTime.getTime() - b.publishedTime.getTime())).toEqual(
      [
        {
          ...new Post('title-15', 'description-15', new Date(2020, 8, 16), 'link-15'),
          screenshot: {
            content: Buffer.from('screenshot for link-15'),
            triedTimes: 1,
          },
        },
        {
          ...new Post('title-16', 'description-16', new Date(2020, 8, 17), 'link-16'),
          screenshot: {
            content: Buffer.from('screenshot for link-16'),
            triedTimes: 1,
          },
        },
        {
          ...new Post('title-17', 'description-17', new Date(2020, 8, 18), 'link-17'),
          screenshot: {
            content: Buffer.from('screenshot for link-17'),
            triedTimes: 1,
          },
        },
        {
          ...new Post('title-18', 'description-18', new Date(2020, 8, 19), 'link-18'),
          screenshot: {
            content: Buffer.from('screenshot for link-18'),
            triedTimes: 1,
          },
        },
        {
          ...new Post('title-19', 'description-19', new Date(2020, 8, 20), 'link-19'),
          screenshot: {
            content: Buffer.from('screenshot for link-19'),
            triedTimes: 1,
          },
        },
      ],
    );
  });

  afterEach(() => {
    jest.clearAllTimers();
    fakeCaptureScreenshot.mockClear();
    fakeRssRequest.mockClear();
  });

  afterAll(() => {
    jest.useRealTimers();
  });
});
