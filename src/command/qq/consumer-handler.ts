import type { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import type { ILogger } from '@services/logging-service';
import { EOL } from 'os';
import { parse as parseHtml, valid as validHtml } from 'node-html-parser';

// [name, link]
function extractLinks(content: string, logger: ILogger): Result.T<[string, string][]> {
  // const html =
  if (validHtml(content) !== true) {
    logger.error(`failed to parse html, content is ${content}`);
    return Result.err(new Error('failed to parse link'));
  }
  const node = parseHtml(content);
  const eles = node.querySelectorAll('a:not(blockquote a)');
  const links: [string, string][] = [];
  for (const ele of eles) {
    const link = ele.getAttribute('href');
    if (link == null) {
      logger.warn(`skip node, no link is found, content: ${content}, ele: `, ele);
    }
    links.push([ele.innerText, link ?? '空']);
  }
  return Result.ok(links);
}

type SendMessage = (message: string, file: Buffer) => Promise<Result.T<1>>;

export function createHandler({
  sendQQMessage,
  sendDiscordMessage,
  logger,
}: {
  sendQQMessage: SendMessage;
  sendDiscordMessage: SendMessage;
  logger: ILogger;
}) {
  return async (post: Post, screenShot: Buffer): Promise<Result.T<1>> => {
    // extract links in the content, otherwise noboday know whatTinks are based
    // on screenshot
    const linksResult = extractLinks(post.content, logger);
    // Text message may cause qq account be baned for a day.
    // We will send screenshot and link only
    const message = [`${post.author}发布了一条新消息`, post.link, '截图发送中'];
    if (!linksResult.isOk) {
      message.push('解析链接失败');
    } else {
      logger.info(`find links: `, linksResult.value);
      const links = linksResult.value;
      if (links.length > 0) {
        message.push('监测到原文中有链接，依次为');
        for (const [name, link] of links) {
          message.push(`${name}: ${link}`);
        }
      }
    }
    // discord is a backup because qq may not be stable. It's ok for the backup to fail.
    // They are unlikely to fail together.
    await sendDiscordMessage(
      [`**${post.title}**`, post.content, `author: ${post.author}`, `link: ${post.link}`].join(EOL),
      screenShot,
    );
    return sendQQMessage(message.join(EOL), screenShot);
  };
}
