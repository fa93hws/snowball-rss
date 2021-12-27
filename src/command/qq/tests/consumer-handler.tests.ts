import type { IQQService } from '@services/qq-service';
import { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import { EOL } from 'os';
import { createHandler } from '../consumer-handler';

describe('qq consumer handler', () => {
  const sendMessageToGroup = jest.fn();
  const qqService: IQQService = {
    sendMessageToGroup,
    sendMessageToUser: jest.fn(),
  };

  it('format post into qq format', async () => {
    sendMessageToGroup.mockResolvedValueOnce(Result.ok(1));
    const handler = createHandler(qqService, 1234567);
    const post = new Post('title', 'content', new Date(123456789), 'link', '<author>');
    await handler(post, Buffer.from('screenShot'));
    expect(sendMessageToGroup).toHaveBeenCalledWith(
      1234567,
      '<author>发布了一条新消息' + EOL + post.link + EOL + '截图发送中',
      Buffer.from('screenShot'),
    );
  });

  afterEach(() => {
    sendMessageToGroup.mockRestore();
  });
});
