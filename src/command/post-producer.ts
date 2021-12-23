import type { ILogger } from '@services/logging-service';
import type { Post } from '@services/rss/snowball/message';
import type { FetchError, ISnowballRssService } from '@services/rss/snowball/service';
import { Result } from '@utils/result';

export class PostProducer {
  private readonly logger: ILogger;
  private readonly snowballRssService: ISnowballRssService;
  // key: link of the post. value: publish date of the post
  private readonly oldPostLinks: Map<string, Date>;
  private readonly maxOldPostKeptCount: number;

  constructor(
    services: { logger: ILogger; snowballRssService: ISnowballRssService },
    options: { oldPostLinks?: Map<string, Date>; maxOldPostKeptCount?: number } = {},
  ) {
    this.logger = services.logger;
    this.snowballRssService = services.snowballRssService;
    this.oldPostLinks = options.oldPostLinks ?? new Map<string, Date>();
    this.maxOldPostKeptCount = options.maxOldPostKeptCount ?? 100;
  }

  // old date first, late date later.
  private sortPostByDate(a: Date, b: Date) {
    return a.getTime() - b.getTime();
  }

  private findNewPosts(posts: Post[]): Post[] {
    const clone = [...posts];
    clone.sort((a, b) => this.sortPostByDate(a.publishedTime, b.publishedTime));
    const newPosts: Post[] = [];
    while (true) {
      const latestPost = clone.pop();
      if (latestPost == null || this.oldPostLinks.has(latestPost.link)) {
        break;
      }
      newPosts.push(latestPost);
    }
    newPosts.sort((a, b) => this.sortPostByDate(a.publishedTime, b.publishedTime));
    return newPosts;
  }

  private maybeRemoveSomeOldPostLinks() {
    if (this.oldPostLinks.size <= this.maxOldPostKeptCount) {
      return;
    }
    const deleteCount = this.oldPostLinks.size - this.maxOldPostKeptCount;
    const arr = Array.from(this.oldPostLinks);
    arr.sort((a, b) => this.sortPostByDate(a[1], b[1]));
    const linkToDelete = arr.slice(0, deleteCount).map((a) => a[0]);
    for (const link of linkToDelete) {
      this.oldPostLinks.delete(link);
    }
  }

  async produceNew(
    snowballUser: string,
    options: {
      // oldPostLinks would be empty on first run
      // So we will use the result for the first run to update it.
      // That means these result should not be considered as new posts
      isFirstRun?: boolean;
    } = {},
  ): Promise<Result.Result<Post[], FetchError>> {
    const fetchResult = await this.snowballRssService.fetch(snowballUser);
    if (!fetchResult.isOk) {
      return Result.err(fetchResult.error);
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
    return options.isFirstRun ? Result.ok([]) : Result.ok(newPosts);
  }
}
