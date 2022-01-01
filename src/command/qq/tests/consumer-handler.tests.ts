import { fakeLogger } from '@services/fake/logging-service';
import type { IQQService } from '@services/qq-service';
import { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import { EOL } from 'os';
import { createHandler } from '../consumer-handler';

describe('qq consumer handler', () => {
  const sendMessageToGroup = jest.fn().mockResolvedValue(Result.ok(1));
  const qqService: IQQService = {
    sendMessageToGroup,
    sendMessageToUser: jest.fn(),
  };

  it('format post into qq format', async () => {
    const handler = createHandler(qqService, 1234567, fakeLogger);
    const post = new Post('title', 'content', new Date(123456789), 'link', '<author>');
    await handler(post, Buffer.from('screenShot'));
    expect(sendMessageToGroup).toHaveBeenCalledWith(
      1234567,
      '<author>发布了一条新消息' + EOL + post.link + EOL + '截图发送中',
      Buffer.from('screenShot'),
    );
  });

  it('catch all links', async () => {
    const handler = createHandler(qqService, 1234567, fakeLogger);
    const content = [
      'message',
      '<a href="http://www.baidu.com" target=_blank>baidu</a>',
      'some other message',
      '<a href="http://www.user.com">@user</a>',
      'some other extra message',
      '<a href="http://www.link.com" title="http://yzs.satcm.gov.cn/zhengcewenjian/2021-12-30/23898.html" target="_blank" class="status-link">网页<div>链</div>接</a>',
      '<a>空</a>',
      'some other extra extra message',
      '<blockquote><a href="http://do.not.display" target=_blank>do not display</a></blockquote>',
      '<blockquote><div><a href="http://do.not.display" target=_blank>do not display</a></div></blockquote>',
    ].join('');
    const post = new Post('title', content, new Date(123456789), 'link', '<author>');
    await handler(post, Buffer.from('screenShot'));
    expect(sendMessageToGroup).toHaveBeenCalledWith(
      1234567,
      [
        '<author>发布了一条新消息',
        'link',
        '截图发送中',
        '监测到原文中有链接，依次为',
        'baidu: http://www.baidu.com',
        '@user: http://www.user.com',
        '网页链接: http://www.link.com',
        '空: 空',
      ].join(EOL),
      Buffer.from('screenShot'),
    );
  });

  it('logs error and will not crash if content is not a valid html', async () => {
    const fakeLogErr = jest.fn();
    const handler = createHandler(qqService, 1234567, {
      ...fakeLogger,
      error: fakeLogErr,
    });
    const content = 'abc<a>def</';
    const post = new Post('title', content, new Date(123456789), 'link', '<author>');
    await handler(post, Buffer.from('screenShot'));
    expect(sendMessageToGroup).toHaveBeenCalledWith(
      1234567,
      '<author>发布了一条新消息' + EOL + post.link + EOL + '截图发送中' + EOL + '解析链接失败',
      Buffer.from('screenShot'),
    );
    expect(fakeLogErr).toHaveBeenCalled();
  });

  afterEach(() => {
    sendMessageToGroup.mockClear();
  });
});
