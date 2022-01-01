import type { IMailService, Mail } from '@services/notification/mail-service';
import type { Post } from '@services/rss/snowball/message';
import type { Result } from '@utils/result';
import sanitizeHtml from 'sanitize-html';
import { EOL } from 'os';

function toMail(post: Post, screenshot: Buffer, subscribers: readonly string[]): Mail {
  const content = sanitizeHtml(post.content);
  const mailText = [
    'Title:',
    post.title,
    '',
    '',
    'Body:',
    content,
    '',
    '',
    `Published at: ${post.publishedTime}`,
    `link: ${post.link}`,
    '',
    '',
  ].join(EOL);

  return {
    subject: 'Subscribed message from snowball-rss',
    text: mailText,
    to: subscribers.join(', '),
    attachments: [
      {
        filename: 'screenshot.png',
        content: screenshot,
        contentType: 'image/png',
      },
    ],
  };
}

export function createhandler(mailService: IMailService, subscribers: readonly string[]) {
  return async (post: Post, screenshot: Buffer): Promise<Result.Result<any, Error>> => {
    const mail = toMail(post, screenshot, subscribers);
    return mailService.send(mail);
  };
}
