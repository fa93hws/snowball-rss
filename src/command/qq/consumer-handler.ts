import type { IQQService } from '@services/qq-service';
import type { Post } from '@services/rss/snowball/message';
import type { Result } from '@utils/result';
import { EOL } from 'os';

export function createHandler(qqService: IQQService, groupId: number) {
  return async (post: Post, screenShot: Buffer): Promise<Result.Result<1, unknown>> => {
    // Text message may cause qq account be baned for a day.
    // We will send screenshot and link only
    const message = '盛京剑客发布了一条新消息' + EOL + post.link + EOL + '截图发送中';
    return qqService.sendMessageToGroup(groupId, message, screenShot);
  };
}
