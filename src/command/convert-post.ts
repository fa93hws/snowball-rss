import type { ILogger } from '@services/logging-service';
import type { Post } from '@services/rss/snowball/message';
import type { IScreenShotService } from '@services/screenshot-service';
import { EOL } from 'os';
import type { Mail } from '@services/mail-service';

export async function postToMail(
  post: Post,
  receviers: string[],
  logger: ILogger,
  screenShotService: IScreenShotService,
): Promise<Mail> {
  const mailText = [
    'Title:',
    post.title,
    '',
    '',
    'Body:',
    post.content,
    '',
    '',
    `Published at: ${post.publishedTime}`,
    `link: ${post.link}`,
    '',
    '',
  ].join(EOL);

  const mail: Mail = {
    subject: 'Subscribed message from snowball-rss',
    text: mailText,
    to: receviers.join(', '),
  };
  const screenshotResult = await screenShotService.capturePage(post.link);
  if (screenshotResult.isOk) {
    mail.attachments = [
      {
        filename: 'screenshot.png',
        content: screenshotResult.value,
        contentType: 'image/png',
      },
    ];
  } else {
    logger.warn('failed to capture screenshot, will send email without it');
  }
  return mail;
}
