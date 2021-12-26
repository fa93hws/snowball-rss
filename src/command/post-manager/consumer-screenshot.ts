import type { ILogger } from '@services/logging-service';
import type { IScreenShotService } from '@services/screenshot-service';
import type { PostWithScreenshot } from './producer';

export interface IPostConsumerScreenshot {
  consume(queue: PostWithScreenshot[]): Promise<void>;
}

export class PostConsumerScreenshot implements IPostConsumerScreenshot {
  private readonly screenshotService: IScreenShotService;
  private readonly logger: ILogger;

  constructor(services: { screenshotService: IScreenShotService; logger: ILogger }) {
    this.screenshotService = services.screenshotService;
    this.logger = services.logger;
  }

  async consume(queue: PostWithScreenshot[]): Promise<void> {
    const postsWithoutScreenshot = queue.filter((post) => post.screenshot?.content == null);
    for (const post of postsWithoutScreenshot) {
      if (post.screenshot == null) {
        post.screenshot = { triedTimes: 1 };
      }
      const screenshotResult = await this.screenshotService.capturePage(post.link);
      if (screenshotResult.isOk) {
        post.screenshot.content = screenshotResult.value;
      } else {
        this.logger.error(
          `screenshot failed for ${post.link}, has tried ${post.screenshot.triedTimes} times`,
        );
      }
    }
  }
}
