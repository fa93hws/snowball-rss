import { Result } from '@utils/result';
import { sanitizeHtml } from '@utils/sanitize';

export class Post {
  constructor(
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
    if (typeof raw.pubDate !== 'string' || isNaN(Date.parse(raw.pubDate))) {
      return Result.err(
        `invalid raw post, expect pubDate to be string and a valid date, got ${raw.pubDate}`,
      );
    }
    const pubDate = new Date(raw.pubDate);
    const post = new Post(
      raw.title,
      sanitizeHtml(raw.description),
      pubDate,
      raw.link,
    );
    return Result.ok(post);
  }
}

export class Message {
  constructor(readonly updateTime: Date, readonly posts: Post[]) {}

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

    if (typeof raw.updated !== 'string' || isNaN(Date.parse(raw.updated))) {
      return Result.err(
        `invalid raw message, expect updated to be string and a valid date, but got ${raw.updated}`,
      );
    }
    const updateDate = new Date(raw.updated);
    return Result.ok(new Message(updateDate, posts));
  }
}
