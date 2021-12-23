import type { ILogger } from '@services/logging-service';
import type { IMailService, Mail } from '@services/mail-service';
import type { Post } from '@services/rss/snowball/message';
import { EOL } from 'os';
import type { PostWithScreenshot } from '../post-manager/producer';

export class PostConsumerForEmail {
  private readonly logger: ILogger;
  private readonly mailService: IMailService;

  constructor(
    services: { logger: ILogger; mailService: IMailService },
    private subscribers: readonly string[],
  ) {
    this.logger = services.logger;
    this.mailService = services.mailService;
  }

  private async toMail(post: Post, screenshot: Buffer): Promise<Mail> {
    const mailText = [
      'Title:',
      post.title,
      '',
      '',
      'Body:',
      post.content,
      '',
      '',
      `Published at: ${post.publishedTime}`,
      `link: ${post.link}`,
      '',
      '',
    ].join(EOL);

    return {
      subject: 'Subscribed message from snowball-rss',
      text: mailText,
      to: this.subscribers.join(', '),
      attachments: [
        {
          filename: 'screenshot.png',
          content: screenshot,
          contentType: 'image/png',
        },
      ],
    };
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
      const mail = await this.toMail(post, post.screenshot.content);
      const result = await this.mailService.send(mail);
      if (!result.isOk) {
        queue.push(post);
      }
      break;
    }
    if (found === false) {
      this.logger.info('no posts with screenshot found, nothing to send');
      return;
    }
  }
}
