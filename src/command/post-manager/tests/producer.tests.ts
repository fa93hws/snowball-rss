import type { ICrashService } from '@services/crash-service';
import { fakeLogger } from '@services/fake/logging-service';
import { Message, Post } from '@services/rss/snowball/message';
import type { ISnowballRssService } from '@services/rss/snowball/service';
import { Result } from '@utils/result';
import { PostProducer } from '../producer';

function postsToOldPostLinks(posts: Post[]): Map<string, Date> {
  const oldPostLinks = new Map<string, Date>();
  for (const post of posts) {
    oldPostLinks.set(post.link, post.publishedTime);
  }
  return oldPostLinks;
}

describe('PostProducer', () => {
  const crash = jest.fn();
  const crashService: ICrashService = { crash };
  const fakeFetch = jest.fn();
  const fakeSnowballRssService: ISnowballRssService = {
    fetch: fakeFetch,
  };
  const posts = new Array(20)
    .fill(0)
    .map(
      (_, idx) =>
        new Post(`title-${idx}`, `content-${idx}`, new Date(2020, 1, idx + 1), `link-${idx}`),
    );

  beforeEach(() => {
    fakeFetch.mockRestore();
  });

  describe('when there is no new posts', () => {
    const oldPostLinks = postsToOldPostLinks(posts.slice(10));

    it('produces nothing', async () => {
      const receivedPosts = posts.slice(10);
      fakeFetch.mockResolvedValue(Result.ok(new Message(new Date(), receivedPosts)));
      const postProducer = new PostProducer(
        {
          crashService,
          logger: fakeLogger,
          snowballRssService: fakeSnowballRssService,
        },
        { oldPostLinks: new Map(oldPostLinks) },
      );
      const result = await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(result).toEqual([]);
    });

    it('ignores old post in fetch result when few latest existing posts are deleted', async () => {
      const receivedPosts = posts.slice(5, -5);
      fakeFetch.mockResolvedValue(Result.ok(new Message(new Date(), receivedPosts)));
      const postProducer = new PostProducer(
        {
          crashService,
          logger: fakeLogger,
          snowballRssService: fakeSnowballRssService,
        },
        { oldPostLinks: new Map(oldPostLinks) },
      );
      const result = await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(result).toEqual([]);
    });
  });

  describe('when there are new posts', () => {
    const oldPostLinks = postsToOldPostLinks(posts.slice(5, 15));

    it('produces new posts', async () => {
      const receivedPosts = posts.slice(10);
      fakeFetch.mockResolvedValue(Result.ok(new Message(new Date(), receivedPosts)));
      const postProducer = new PostProducer(
        {
          crashService,
          logger: fakeLogger,
          snowballRssService: fakeSnowballRssService,
        },
        { oldPostLinks: new Map(oldPostLinks) },
      );
      const result = await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(posts.slice(15));
    });

    it('update old post links after producing new posts', async () => {
      const receivedPosts = posts.slice(10);
      const cloneOfOldPostLinks = new Map(oldPostLinks);
      fakeFetch.mockResolvedValue(Result.ok(new Message(new Date(), receivedPosts)));
      const postProducer = new PostProducer(
        {
          crashService,
          logger: fakeLogger,
          snowballRssService: fakeSnowballRssService,
        },
        { oldPostLinks: cloneOfOldPostLinks },
      );
      await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(cloneOfOldPostLinks).toEqual(postsToOldPostLinks(posts.slice(5)));
    });

    it('produces new posts correctly if few latest existing posts are deleted', async () => {
      // user delete 3 posts: 12, 13, 14, which is the latest existing posts
      // user posts 5 new posts: 15, 16, 17, 18, 19
      // each fetch will return 10 posts so it will not return older one
      const receivedPosts = [...posts.slice(7, 12), ...posts.slice(15)];
      fakeFetch.mockResolvedValue(Result.ok(new Message(new Date(), receivedPosts)));
      const postProducer = new PostProducer(
        {
          crashService,
          logger: fakeLogger,
          snowballRssService: fakeSnowballRssService,
        },
        { oldPostLinks: new Map(oldPostLinks) },
      );
      const result = await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(posts.slice(15));
    });

    it('ignores old post in fetch result', async () => {
      // user delete post 11,12,13,14, which is the latest existing posts
      // user posts 2 new posts, which is 15 and 16
      // each fetch will return 10 posts so it will return older one
      const receivedPosts = [...posts.slice(3, 11), posts[15], posts[16]];
      fakeFetch.mockResolvedValue(Result.ok(new Message(new Date(), receivedPosts)));
      const postProducer = new PostProducer(
        {
          crashService,
          logger: fakeLogger,
          snowballRssService: fakeSnowballRssService,
        },
        { oldPostLinks: new Map(oldPostLinks) },
      );
      const result = await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(result).toEqual([posts[15], posts[16]]);
    });
  });

  describe('when it is first run', () => {
    it('returns empty array and update old posts link', async () => {
      const receivedPosts = posts.slice(10);
      const myOldPostLinks = new Map<string, Date>();
      fakeFetch.mockResolvedValue(Result.ok(new Message(new Date(), receivedPosts)));
      const postProducer = new PostProducer(
        {
          crashService,
          logger: fakeLogger,
          snowballRssService: fakeSnowballRssService,
        },
        { oldPostLinks: myOldPostLinks },
      );
      const result = await postProducer.produceNew('user-id', { isFirstRun: true });
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(result).toEqual([]);
      expect(myOldPostLinks).toEqual(postsToOldPostLinks(receivedPosts));
    });
  });

  describe('when there is error during fetching', () => {
    it('returns empty array for network error', async () => {
      const err = Result.err({ kind: 'network', error: new Error('network error') });
      fakeFetch.mockResolvedValue(err);
      const postProducer = new PostProducer({
        crashService,
        logger: fakeLogger,
        snowballRssService: fakeSnowballRssService,
      });
      const result = await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(result).toEqual([]);
      expect(crash).not.toHaveBeenCalled();
    });

    it('crashs for parsing error', async () => {
      const err = Result.err({ kind: 'parse', error: new Error('network error') });
      fakeFetch.mockResolvedValue(err);
      const postProducer = new PostProducer({
        crashService,
        logger: fakeLogger,
        snowballRssService: fakeSnowballRssService,
      });
      const result = await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(crash).toHaveBeenCalled();
    });
  });

  describe('cleaning', () => {
    it('clean oldPostLinks when it has too many records', async () => {
      const oldPostLinks = postsToOldPostLinks(posts.slice(5, 15));
      const receivedPosts = posts.slice(10);
      const cloneOfOldPostLinks = new Map(oldPostLinks);
      fakeFetch.mockResolvedValue(Result.ok(new Message(new Date(), receivedPosts)));
      const postProducer = new PostProducer(
        {
          crashService,
          logger: fakeLogger,
          snowballRssService: fakeSnowballRssService,
        },
        { oldPostLinks: cloneOfOldPostLinks, maxOldPostKeptCount: 12 },
      );
      await postProducer.produceNew('user-id');
      expect(fakeFetch).toHaveBeenCalledWith('user-id');
      expect(cloneOfOldPostLinks).toEqual(postsToOldPostLinks(posts.slice(8)));
    });
  });
});
