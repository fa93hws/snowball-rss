import type { ILogger } from '@services/logging-service';
import type { ISlackService } from '@services/slack-service';
import type { PostWithScreenshot } from '../post-manager/producer';

export class PostConsumerForSlack {
  private readonly logger: ILogger;
  private readonly slackService: ISlackService;

  constructor(
    services: { logger: ILogger; slackService: ISlackService },
    private readonly channel: string,
  ) {
    this.logger = services.logger;
    this.slackService = services.slackService;
  }

  async consume(queue: PostWithScreenshot[]): Promise<void> {
    let found = false;
    for (let idx = 0; idx < queue.length; idx++) {
      const post = queue[idx];
      if (post.screenshot?.content == null) {
        continue;
      }
      found = true;
      queue.splice(idx, 1);
      const messageText = post.content;
      const result = await this.slackService.postSimpleMessage({
        channel: this.channel,
        text: messageText,
        image: {
          content: post.screenshot.content,
          filename: `screenshot.${post.screenshot.triedTimes}.png`,
        },
      });
      if (!result.isOk) {
        queue.push(post);
      }
      break;
    }
    if (found === false) {
      this.logger.verbose('no posts with screenshot found, nothing to send');
      return;
    }
  }
}
