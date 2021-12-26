import type { ISlackService } from '@services/slack-service';
import type { Post } from '@services/rss/snowball/message';

export function createhandler(slackService: ISlackService, notificationChannel: string) {
  return async (post: Post, screenshot: Buffer) =>
    slackService.postSimpleMessage({
      channel: notificationChannel,
      abstract: post.title,
      text: post.content,
      image: {
        content: screenshot,
        filename: 'screenshot.png',
      },
    });
}
