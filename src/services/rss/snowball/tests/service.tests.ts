import { Result } from '@utils/result';
import type { IRssHubService } from '@services/rss/rsshub-service';
import { fakeLogger } from '@services/fake/fake-logging-service';
import { SnowballRssService } from '../service';
import { Message, Post } from '../message';

describe('fetch', () => {
  const mockRequest = jest.fn();
  const rssHubService: IRssHubService = {
    init: jest.fn(),
    request: mockRequest,
  };
  const snowballRssService = new SnowballRssService(rssHubService, fakeLogger);
  beforeEach(() => {
    mockRequest.mockRestore();
  });

  it('parse message correctly', async () => {
    mockRequest.mockResolvedValueOnce({
      lastBuildDate: 'Wed, 22 Dec 2021 04:44:14 GMT',
      updated: '2021-12-22T04:44:14.812Z',
      ttl: 5,
      atomlink: 'https://rsshub.app/xueqiu/user/6784593966',
      title: '盛京剑客 的雪球全部动态',
      link: 'https://xueqiu.com/u/6784593966',
      description: '盛京剑客 的雪球全部动态',
      item: [
        {
          title: 'title1',
          description: 'description1',
          pubDate: 'Wed, 22 Dec 2021 02:16:58 GMT',
          link: 'link1',
        },
        {
          title: 'title2',
          description: 'description2',
          pubDate: 'Fri, 17 Dec 2021 08:31:19 GMT',
          link: 'link2',
        },
      ],
    });
    const messageResult = await snowballRssService.fetch('some_url');
    expect(mockRequest).toHaveBeenCalledWith('some_url');
    expect(messageResult.isOk).toBe(true);
    const posts = [
      new Post(
        'title1',
        'description1',
        new Date('2021-12-22T02:16:58Z'),
        'link1',
      ),
      new Post(
        'title2',
        'description2',
        new Date('2021-12-17T08:31:19Z'),
        'link2',
      ),
    ];
    expect(Result.unwrap(messageResult)).toEqual(
      new Message(new Date('2021-12-22T04:44:14.812Z'), posts),
    );
  });

  it('returns parsing error when fetch result is some random object', async () => {
    mockRequest.mockResolvedValueOnce({ who: 'am I?' });
    const messageResult = await snowballRssService.fetch('some_url');
    expect(mockRequest).toHaveBeenCalledWith('some_url');
    expect(messageResult.isOk).toBe(false);
    if (messageResult.isOk) {
      throw new Error('it should not be ok');
    }
    expect(messageResult.error.kind).toEqual('parse');
  });

  it('returns network error when fetch failed', async () => {
    mockRequest.mockRejectedValueOnce(1);
    const messageResult = await snowballRssService.fetch('some_url');
    expect(mockRequest).toHaveBeenCalledWith('some_url');
    expect(messageResult.isOk).toBe(false);
    if (messageResult.isOk) {
      throw new Error('it should not be ok');
    }
    expect(messageResult.error.kind).toEqual('network');
  });
});
