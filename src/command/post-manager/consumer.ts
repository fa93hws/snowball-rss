import type { ILogger } from '@services/logging-service';
import type { Post } from '@services/rss/snowball/message';
import type { Result } from '@utils/result';
import type { PostWithScreenshot } from './producer';

export interface IPostConsumer {
  consumeOne(queue: PostWithScreenshot[]): Promise<void> | undefined;
}

export class PostConsumer implements IPostConsumer {
  constructor(
    private readonly logger: ILogger,
    private readonly handler: (post: Post, image: Buffer) => Promise<Result.T<any, any>>,
  ) {}

  async consumeOne(queue: PostWithScreenshot[]): Promise<void> {
    let found = false;
    for (let idx = 0; idx < queue.length; idx++) {
      const post = queue[idx];
      if (post.screenshot?.content == null) {
        continue;
      }
      found = true;
      queue.splice(idx, 1);
      const result = await this.handler(post, post.screenshot.content);
      if (!result.isOk) {
        queue.push(post);
      }
      break;
    }
    if (found === false) {
      this.logger.verbose('no posts with screenshot found, nothing to handle');
      return;
    }
  }
}
