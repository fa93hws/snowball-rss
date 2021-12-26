import { Post } from '@services/rss/snowball/message';
import type { IMailService } from '@services/notification/mail-service';
import { createhandler } from '../consumer-handler';

describe('PostConsumerForEmail', () => {
  const mockSendMail = jest.fn();
  const fakeMailService: IMailService = {
    send: mockSendMail,
  };
  const subscribers: string[] = ['user-a@service-a.com', 'user-b@service-b.com'];

  const date = new Date();
  const post = new Post('title-2', 'content-2', date, 'post_url-2');

  it('produces the given format with attachments', async () => {
    const handler = createhandler(fakeMailService, subscribers);
    await handler(post, Buffer.from('fake-screenshot'));
    expect(mockSendMail).toHaveBeenCalledWith({
      subject: 'Subscribed message from snowball-rss',
      to: 'user-a@service-a.com, user-b@service-b.com',
      text: [
        'Title:',
        'title-2',
        '',
        '',
        'Body:',
        'content-2',
        '',
        '',
        `Published at: ${date}`,
        `link: post_url-2`,
        '',
        '',
      ].join('\n'),
      attachments: [
        {
          filename: 'screenshot.png',
          content: Buffer.from('fake-screenshot'),
          contentType: 'image/png',
        },
      ],
    });
  });
});
