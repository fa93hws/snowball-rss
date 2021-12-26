import { Post } from '@services/rss/snowball/message';
import { Result } from '@utils/result';
import { createhandler } from '../consumer-handler';
import type { ISlackService } from '@services/slack-service';

describe('ConsumerHandlerForSlack', () => {
  const mockPostMessage = jest.fn();
  const fakeSlackService: ISlackService = {
    postSimpleMessage: mockPostMessage,
  };

  const date = new Date();
  const post = new Post('title-2', 'content-2', date, 'post_url-2');

  it('take first post to given format with attachments', async () => {
    mockPostMessage.mockResolvedValue(Result.ok(null));
    const handler = createhandler(fakeSlackService, '#channel');
    await handler(post, Buffer.from('fake-screenshot'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: '#channel',
      abstract: 'title-2',
      text: 'content-2',
      image: {
        content: Buffer.from('fake-screenshot'),
        filename: 'screenshot.png',
      },
    });
    mockPostMessage.mockRestore();
  });
});
