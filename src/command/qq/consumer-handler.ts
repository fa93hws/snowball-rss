import type { IQQService } from '@services/qq-service';
import type { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import type { ILogger } from '@services/logging-service';
import { EOL } from 'os';
import { parse as parseHtml, valid as validHtml } from 'node-html-parser';

// [name, link]
function extractLinks(content: string, logger: ILogger): Result.Result<[string, string][]> {
  // const html =
  if (validHtml(content) !== true) {
    logger.error(`failed to parse html, content is ${content}`);
    return Result.err('解析链接失败');
  }
  const node = parseHtml(content);
  const eles = node.querySelectorAll('a:not(blockquote a)');
  const links: [string, string][] = [];
  for (const ele of eles) {
    const link = ele.getAttribute('href');
    if (link == null) {
      logger.warn(`skip node, no link is found, content: ${content}, ele: `);
      logger.warn(ele);
    }
    links.push([ele.innerText, link ?? '空']);
  }
  return Result.ok(links);
}

export function createHandler(qqService: IQQService, groupId: number, logger: ILogger) {
  return async (post: Post, screenShot: Buffer): Promise<Result.Result<1, unknown>> => {
    // extract links in the content, otherwise noboday know what the links are based
    // on screenshot
    const linksResult = extractLinks(post.content, logger);
    // Text message may cause qq account be baned for a day.
    // We will send screenshot and link only
    const message = [`${post.author}发布了一条新消息`, post.link, '截图发送中'];
    if (!linksResult.isOk) {
      message.push(linksResult.error);
    } else {
      logger.info(`find links: ${JSON.stringify(linksResult)}`);
      const links = linksResult.value;
      if (links.length > 0) {
        message.push('监测到原文中有链接，依次为');
        for (const [name, link] of links) {
          message.push(`${name}: ${link}`);
        }
      }
    }
    return qqService.sendMessageToGroup(groupId, message.join(EOL), screenShot);
  };
}
