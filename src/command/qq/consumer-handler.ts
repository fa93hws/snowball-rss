import type { IQQService } from '@services/qq-service';
import type { Post } from '@services/rss/snowball/message';
import type { Result } from '@utils/result';
import { EOL } from 'os';

export function createHandler(qqService: IQQService, groupId: number) {
  return async (post: Post, screenShot: Buffer): Promise<Result.Result<1, unknown>> => {
    const message = post.content + EOL + EOL + post.link;
    return qqService.sendMessageToGroup(groupId, message, screenShot);
  };
}
