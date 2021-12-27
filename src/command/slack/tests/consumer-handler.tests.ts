import { Post } from '@services/rss/snowball/message';
import type { ISlackService } from '@services/slack-service';
import { Result } from '@utils/result';
import { EOL } from 'os';
import { createhandler } from '../consumer-handler';

describe('ConsumerHandlerForSlack', () => {
  const mockPostMessage = jest.fn();
  const fakeSlackService: ISlackService = {
    postSimpleMessage: mockPostMessage,
  };

  const date = new Date();
  const post = new Post('title-2', 'content-2', date, 'post_url-2', 'author');

  it('take first post to given format with attachments', async () => {
    mockPostMessage.mockResolvedValue(Result.ok(null));
    const handler = createhandler(fakeSlackService, '#channel');
    await handler(post, Buffer.from('fake-screenshot'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: '#channel',
      abstract: 'title-2',
      text: ['content-2', '', 'post_url-2'].join(EOL),
      image: {
        content: Buffer.from('fake-screenshot'),
        filename: 'screenshot.png',
      },
    });
    mockPostMessage.mockRestore();
  });
});
