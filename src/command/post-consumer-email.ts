import type { ILogger } from '@services/logging-service';
import type { IMailService, Mail } from '@services/mail-service';
import type { Post } from '@services/rss/snowball/message';
import type { IScreenShotService } from '@services/screenshot-service';
import { EOL } from 'os';

export class PostConsumerForEmail {
  private readonly logger: ILogger;
  private readonly screenshotService: IScreenShotService;
  private readonly mailService: IMailService;

  constructor(services: {
    logger: ILogger;
    screenshotService: IScreenShotService;
    mailService: IMailService;
  }) {
    this.logger = services.logger;
    this.screenshotService = services.screenshotService;
    this.mailService = services.mailService;
  }

  private async postToMail(post: Post, receviers: string[]): Promise<Mail> {
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

    const mail: Mail = {
      subject: 'Subscribed message from snowball-rss',
      text: mailText,
      to: receviers.join(', '),
    };
    const screenshotResult = await this.screenshotService.capturePage(post.link);
    if (screenshotResult.isOk) {
      mail.attachments = [
        {
          filename: 'screenshot.png',
          content: screenshotResult.value,
          contentType: 'image/png',
        },
      ];
    } else {
      this.logger.warn('failed to capture screenshot, will send email without it');
    }
    return mail;
  }

  async consume(queue: Post[], subscribers: string[]): Promise<void> {
    const post = queue.shift();
    if (post == null) {
      this.logger.info('no new posts, nothing to consume');
      return;
    }
    const mail = await this.postToMail(post, subscribers);
    const result = await this.mailService.send(mail);
    if (!result.isOk) {
      queue.unshift(post);
    }
  }
}
