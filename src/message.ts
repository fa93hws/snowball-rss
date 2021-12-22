import { Result } from './result';
import type { Mail } from './mailer';
import { EOL } from 'os';
import { sanitizeHtml } from './sanitize';
import { takeScreenShot } from './screenshot';
import { ILogger } from './logger';

export class Post {
  private constructor(
    readonly title: string,
    readonly content: string,
    readonly publishedTime: Date,
    readonly link: string,
  ) {}

  /**
   * valid shape:
   * title: string,
   * description: string,
   * pubDate: string, formated as Mon, 20 Dec 2021 02:43:00 GMT
   * link: string,
   */
  static fromRaw(raw: any): Result.Result<Post> {
    if (raw == null || typeof raw !== 'object') {
      return Result.err(`invalid raw post, expect object, but got ${raw}`);
    }
    if (typeof raw.title !== 'string') {
      return Result.err(
        `invalid raw post, expect title to be string, but got ${raw.title}`,
      );
    }
    if (typeof raw.description !== 'string') {
      return Result.err(
        `invalid raw post, expect description to be string, but got ${raw.description}`,
      );
    }
    if (typeof raw.link !== 'string') {
      return Result.err(
        `invalid raw post, expect link to be string, but got ${raw.link}`,
      );
    }
    let pubDate: Date;
    try {
      pubDate = new Date(raw.pubDate);
    } catch {
      return Result.err(
        `invalid raw post, expect pubDate to be valid date, got ${raw.pubDate}`,
      );
    }
    const post = new Post(
      raw.title,
      sanitizeHtml(raw.description),
      pubDate,
      raw.link,
    );
    return Result.ok(post);
  }

  async toMail(to: string, logger: ILogger): Promise<Mail> {
    const mailText = [
      'Title:',
      this.title,
      '',
      '',
      'Body:',
      this.content,
      '',
      '',
      `Published at: ${this.publishedTime}`,
      `link: ${this.link}`,
    ].join(EOL);

    const mail: Mail = {
      subject: 'Subscribed message from snowball-rss',
      text: mailText,
      to,
    };
    logger.verbose('taking snapshot');
    const screenshotResult = await takeScreenShot(this.link);
    if (screenshotResult.isOk) {
      logger.verbose('snapshot taken');
      mail.attachments = [
        {
          filename: 'screenshot.jpeg',
          content: screenshotResult.value,
          contentType: 'image/jpeg',
        },
      ];
    } else {
      logger.error(screenshotResult.error);
    }
    return mail;
  }
}

export class Message {
  private constructor(readonly updateTime: Date, readonly posts: Post[]) {}

  /**
   * valid shape:
   * item: raw post, see Post:fromRaw,
   * updated: string, formated as Mon, 20 Dec 2021 02:43:00 GMT
   */
  static fromRaw(raw: any): Result.Result<Message> {
    if (raw == null || typeof raw !== 'object') {
      return Result.err(`invalid raw message, expect object, but got ${raw}`);
    }
    if (!Array.isArray(raw.item)) {
      return Result.err(
        `invalid raw message, expect item to be an array, but got ${raw.item}`,
      );
    }
    const postParseResults = (raw.item as any[]).map(Post.fromRaw);
    if (postParseResults.every((r) => r.isOk === false)) {
      return Result.err(
        postParseResults
          .filter((r): r is Result.Err => r.isOk === false)
          .map((r) => r.error)
          .join('\n') + `raw: ${raw}`,
      );
    }
    const posts = postParseResults.map(Result.unwrap);

    let updateDate: Date;
    try {
      updateDate = new Date(raw.updated);
    } catch {
      return Result.err(
        `invalid raw message, expect updated to be valid date, got ${raw.updated}`,
      );
    }
    return Result.ok(new Message(updateDate, posts));
  }
}
