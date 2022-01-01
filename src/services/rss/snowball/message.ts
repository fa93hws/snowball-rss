import { Result } from '@utils/result';

export class Post {
  constructor(
    readonly title: string,
    readonly content: string,
    readonly publishedTime: Date,
    readonly link: string,
    readonly author: string,
  ) {}

  /**
   * valid shape:
   * title: string,
   * description: string,
   * pubDate: string, formated as Mon, 20 Dec 2021 02:43:00 GMT
   * link: string,
   */
  static fromRaw(raw: any, author: string): Result.Result<Post> {
    if (raw == null || typeof raw !== 'object') {
      return Result.err(`invalid raw post, expect object, but got ${raw}`);
    }
    if (typeof raw.title !== 'string') {
      return Result.err(`invalid raw post, expect title to be string, but got ${raw.title}`);
    }
    if (typeof raw.description !== 'string') {
      return Result.err(
        `invalid raw post, expect description to be string, but got ${raw.description}`,
      );
    }
    if (typeof raw.link !== 'string') {
      return Result.err(`invalid raw post, expect link to be string, but got ${raw.link}`);
    }
    if (typeof raw.pubDate !== 'string' || isNaN(Date.parse(raw.pubDate))) {
      return Result.err(
        `invalid raw post, expect pubDate to be string and a valid date, got ${raw.pubDate}`,
      );
    }
    const pubDate = new Date(raw.pubDate);
    const post = new Post(raw.title, raw.description, pubDate, raw.link, author);
    return Result.ok(post);
  }
}

export class Message {
  constructor(readonly updateTime: Date, readonly posts: Post[], readonly author: string) {}

  /**
   * valid shape:
   * item: raw post, see Post:fromRaw,
   * updated: string, formated as Mon, 20 Dec 2021 02:43:00 GMT
   */
  static fromRaw(raw: any): Result.Result<Message> {
    if (raw == null || typeof raw !== 'object') {
      return Result.err(`invalid raw message, expect object, but got ${raw}`);
    }
    const title = raw.title;
    const suffix = ' 的雪球全部动态';
    if (typeof title !== 'string') {
      return Result.err(`invalid raw message, expect title to be string, but got ${raw.title}`);
    } else if (!title.includes(suffix)) {
      return Result.err(
        `invalid title, expect title to be "<author>${suffix}", but got ${raw.title}`,
      );
    }
    const author = title.slice(0, -suffix.length);
    if (!Array.isArray(raw.item)) {
      return Result.err(`invalid raw message, expect item to be an array, but got ${raw.item}`);
    }
    const postParseResults = (raw.item as any[]).map((rawPost) => Post.fromRaw(rawPost, author));
    if (postParseResults.some((r) => r.isOk === false)) {
      return Result.err(
        `${postParseResults
          .filter((r): r is Result.Err => r.isOk === false)
          .map((r) => r.error)
          .join('\n')}raw: ${raw}`,
      );
    }
    const posts = postParseResults.map(Result.unwrap);

    if (typeof raw.updated !== 'string' || isNaN(Date.parse(raw.updated))) {
      return Result.err(
        `invalid raw message, expect updated to be string and a valid date, but got ${raw.updated}`,
      );
    }
    const updateDate = new Date(raw.updated);

    return Result.ok(new Message(updateDate, posts, author));
  }
}
