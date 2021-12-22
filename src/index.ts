import { Logger, ILogger } from '@services/logging-service';
import type { Post } from '@services/rss/snowball/message';
import { SnowballRssService } from '@services/rss/snowball/service';
import {
  IScreenShotService,
  ScreenShotService,
} from '@services/screenshot-service';
import RSSHub from 'rsshub';
import { EOL } from 'os';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { GlobalMutable } from './utils/global';
import { config } from './config';
import { MailService, Mail } from './services/mail-service';
import { rssHubService } from '@services/rss/rsshub-service';

async function postToMail(
  post: Post,
  to: string,
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
  ].join(EOL);

  const mail: Mail = {
    subject: 'Subscribed message from snowball-rss',
    text: mailText,
    to,
  };
  const screenshotResult = await screenShotService.capturePage(post.link);
  if (screenshotResult.isOk) {
    mail.attachments = [
      {
        filename: 'screenshot.jpeg',
        content: screenshotResult.value,
        contentType: 'image/jpeg',
      },
    ];
  } else {
    logger.warn('failed to capture screenshot, will send email without it');
  }
  return mail;
}

type CliArgs = {
  sendTestEmail: boolean;
  intervalSecond: number;
};

async function handler(args: CliArgs) {
  const logger = new Logger();
  const snowballRssService = new SnowballRssService(rssHubService, logger);
  const screenShotService = new ScreenShotService(logger);
  const globalMutable = new GlobalMutable(logger);

  const subscribers = config.mailer.subscriber.join(', ');
  RSSHub.init({
    CACHE_TYPE: null,
    titleLengthLimit: 65535,
  });
  const mailService = new MailService(
    {
      service: config.mailer.service,
      user: config.mailer.sender.user,
      pass: config.mailer.sender.pass,
    },
    logger,
  );

  if (args.sendTestEmail) {
    logger.info('sending dummy email to ensure auth success');
    await mailService.send({
      to: config.mailer.adminEmail,
      subject: 'testing email service',
      text: 'This email may go to junk mail, remember to have a check there as well.',
    });
  }

  async function work(): Promise<boolean> {
    const fetchResult = await snowballRssService.fetch(config.xueqiu.url);
    if (!fetchResult.isOk) {
      if (fetchResult.error.kind === 'parse') {
        await mailService.send({
          to: config.mailer.adminEmail,
          subject: 'xueqiu-rss is down due to parsing error',
          text: fetchResult.error.message,
        });
        return false;
      }
      return true;
    }

    logger.info('fetch success');
    const message = fetchResult.value;
    logger.debug(`got message from ${config.xueqiu.url}`);
    logger.debug({
      time: message.updateTime,
      posts: message.posts.map((p) => p.title.substring(0, 30)),
    });
    const mailsToSend = await Promise.all(
      message.posts
        .filter(
          (post) =>
            globalMutable.lastUpdateTime != null &&
            post.publishedTime > globalMutable.lastUpdateTime,
        )
        .map((post) =>
          postToMail(post, subscribers, logger, screenShotService),
        ),
    );
    await Promise.all(mailsToSend.map((mail) => mailService.send(mail)));
    if (mailsToSend.length === 0) {
      logger.info('no new posts, nothing to send');
    }
    globalMutable.setLastUpdateTime(message.updateTime);
    return true;
  }

  async function scheduleWork() {
    const canContinue = await work();
    if (canContinue) {
      logger.debug(
        `can continue, next run after ${args.intervalSecond} seconds`,
      );
      setTimeout(scheduleWork, args.intervalSecond * 1000);
    } else {
      logger.error('can not continue, exit');
    }
  }
  await scheduleWork();
}

export function main() {
  dotenv.config();
  const yargsInstance = yargs(hideBin(process.argv));
  yargsInstance
    .command('$0', 'start schedule fetching', {
      builder: (args): yargs.Argv<CliArgs> =>
        args
          .option('sendTestEmail', {
            type: 'boolean',
            default: false,
          })
          .option('intervalSecond', {
            type: 'number',
            default: 60,
          }),
      handler,
    })
    .strict(true)
    .exitProcess(true)
    .demandCommand()
    .showHelpOnFail(false, 'Specify --help for available options')
    .help()
    .parse();
}

main();
