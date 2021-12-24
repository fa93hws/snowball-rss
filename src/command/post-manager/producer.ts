import type { ICrashService } from '@services/crash-service';
import type { ILogger } from '@services/logging-service';
import type { Post } from '@services/rss/snowball/message';
import type { ISnowballRssService } from '@services/rss/snowball/service';

export type PostWithScreenshot = Post & {
  screenshot?: {
    content?: Buffer;
    triedTimes: number;
  };
};

export interface IPostProducer {
  produceNew(
    snowballUser: string,
    options?: {
      isFirstRun?: boolean;
    },
  ): Promise<PostWithScreenshot[]>;
}

export class PostProducer implements IPostProducer {
  private readonly logger: ILogger;
  private readonly snowballRssService: ISnowballRssService;
  private readonly crashService: ICrashService;
  // key: link of the post. value: publish date of the post
  private readonly oldPostLinks: Map<string, Date>;
  private oldestPostDate: Date;
  // when full, half of the old post links will be removed
  private readonly maxOldPostKeptCount: number;

  constructor(
    services: {
      logger: ILogger;
      snowballRssService: ISnowballRssService;
      crashService: ICrashService;
    },
    options: { oldPostLinks?: Map<string, Date>; maxOldPostKeptCount?: number } = {},
  ) {
    this.logger = services.logger;
    this.snowballRssService = services.snowballRssService;
    this.crashService = services.crashService;
    this.oldPostLinks = options.oldPostLinks ?? new Map<string, Date>();
    this.maxOldPostKeptCount = options.maxOldPostKeptCount ?? 255;
    this.oldestPostDate = this.findOldestPostDate();
  }

  // old date first, late date later.
  private sortPostByDate(a: Date, b: Date) {
    return a.getTime() - b.getTime();
  }

  private findOldestPostDate(): Date {
    if (this.oldPostLinks.size === 0) {
      return new Date(0);
    }
    const arr = Array.from(this.oldPostLinks.values());
    arr.sort((a, b) => this.sortPostByDate(a, b));
    return arr[0];
  }

  private findNewPosts(posts: Post[]): Post[] {
    const clone = [...posts];
    clone.sort((a, b) => this.sortPostByDate(a.publishedTime, b.publishedTime));
    const newPosts: Post[] = [];
    while (true) {
      const post = clone.pop();
      if (post == null) {
        break;
      }
      if (this.oldPostLinks.has(post.link) || post.publishedTime < this.oldestPostDate) {
        continue;
      }
      newPosts.push(post);
    }
    newPosts.sort((a, b) => this.sortPostByDate(a.publishedTime, b.publishedTime));
    return newPosts;
  }

  private maybeRemoveSomeOldPostLinks() {
    if (this.oldPostLinks.size <= this.maxOldPostKeptCount) {
      return;
    }
    const numToRemove = this.oldPostLinks.size - Math.floor(this.maxOldPostKeptCount / 2);
    const arr = Array.from(this.oldPostLinks);
    arr.sort((a, b) => this.sortPostByDate(a[1], b[1]));
    const linkToDelete = arr.slice(0, numToRemove).map((a) => a[0]);
    for (const link of linkToDelete) {
      this.oldPostLinks.delete(link);
    }
  }

  async produceNew(
    snowballUser: string,
    options: { isFirstRun?: boolean } = {},
  ): Promise<PostWithScreenshot[]> {
    const fetchResult = await this.snowballRssService.fetch(snowballUser);
    if (!fetchResult.isOk) {
      if (fetchResult.error.kind === 'parse') {
        return this.crashService.crash('parsing error: ' + fetchResult.error.message);
      } else {
        this.logger.error('fetch error: ' + fetchResult.error.message);
        return [];
      }
    }
    const message = fetchResult.value;
    this.logger.debug(`fetch success, got message for user ${snowballUser}`);
    this.logger.debug({
      time: message.updateTime,
      posts: message.posts.map((p) => p.title.substring(0, 30)),
    });

    const newPosts = this.findNewPosts(message.posts);
    for (const newPost of newPosts) {
      this.oldPostLinks.set(newPost.link, newPost.publishedTime);
      if (!options.isFirstRun) {
        this.logger.info('found new post, push to queue, post is');
        this.logger.info(newPost);
      }
    }
    this.maybeRemoveSomeOldPostLinks();
    /**
     * oldPostLinks would be empty on first run
     * So we will use the result for the first run to update it.
     * That means these result should not be considered as new posts
     */
    return options.isFirstRun ? [] : newPosts;
  }
}
