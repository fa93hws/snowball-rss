import { Logger } from '@services/logging-service';
import { SnowballRssService } from '@services/rss/snowball/service';
import { ScreenShotService } from '@services/screenshot-service';
import { rssHubService } from '@services/rss/rsshub-service';
import { MailService } from '@services/mail-service';
import { GlobalMutable } from '@utils/global';
import type { CommandModule } from 'yargs';
import * as path from 'path';
import dotenv from 'dotenv';
import { postToMail } from './convert-post';
import { readVarsFromEnvs } from './read-envs';
import { Scheduler, WorkResult } from './scheduler';

type CliArgs = {
  sendTestEmail: boolean;
  intervalSecond: number;
  dotEnvFile?: string;
  doNotRun: boolean;
};

async function handler(args: CliArgs): Promise<void> {
  if (args.doNotRun) {
    return;
  }
  dotenv.config({ path: args.dotEnvFile });
  const envVars = readVarsFromEnvs();
  const repoRoot = path.join(__dirname, '..', '..');
  const logger = new Logger({ dirname: path.join(repoRoot, 'logs', 'app') });
  const snowballRssService = new SnowballRssService(rssHubService, logger);
  const screenShotService = new ScreenShotService(logger);
  const globalMutable = new GlobalMutable(logger);

  rssHubService.init({
    CACHE_TYPE: null,
    titleLengthLimit: 65535,
  });
  const mailService = new MailService(
    {
      service: envVars.botEmailService,
      user: envVars.botEmailAddress,
      pass: envVars.botEmailPass,
    },
    logger,
  );

  if (args.sendTestEmail) {
    logger.info('sending dummy email to ensure auth success');
    await mailService.send({
      to: envVars.adminEmailAdress,
      subject: 'testing email service',
      text: 'This email may go to junk mail, remember to have a check there as well.',
    });
  }

  async function scheduledWork(): Promise<WorkResult> {
    const fetchResult = await snowballRssService.fetch(envVars.snowballUserId);
    if (!fetchResult.isOk) {
      if (fetchResult.error.kind === 'parse') {
        await mailService.send({
          to: envVars.adminEmailAdress,
          subject: 'snowball-rss is down due to parsing error',
          text: fetchResult.error.message,
        });
        return { shouldContinue: false };
      }
      return { shouldContinue: true };
    }

    logger.info('fetch success');
    const message = fetchResult.value;
    logger.debug(`got message for user ${envVars.snowballUserId}`);
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
        .map((post) => postToMail(post, envVars.subscribers, logger, screenShotService)),
    );
    await Promise.all(mailsToSend.map((mail) => mailService.send(mail)));
    if (mailsToSend.length === 0) {
      logger.info('no new posts, nothing to send');
    }
    globalMutable.setLastUpdateTime(message.updateTime);
    return { shouldContinue: true };
  }

  const scheduler = new Scheduler({
    intervalSecond: args.intervalSecond,
    scheduledWork,
    logger,
    name: 'the only one',
    immediate: true,
  });
  scheduler.start();
}

export const commandModule: CommandModule<{}, CliArgs> = {
  command: '$0',
  describe: 'schedule fetching from snowball rss and notifiy subscribers',
  builder: (yargs) =>
    yargs
      .option('sendTestEmail', {
        type: 'boolean',
        describe: 'whether to send a test email to ensure auth success',
        default: false,
      })
      .option('intervalSecond', {
        type: 'number',
        describe: 'how often fetching is happened, in second',
        default: 60,
      })
      .option('dotEnvFile', {
        type: 'string',
        describe: 'path to .env file',
      })
      .option('doNotRun', {
        type: 'boolean',
        describe: 'if true, handler will not be called. For test purpose only!',
        default: false,
      }),
  handler,
};
