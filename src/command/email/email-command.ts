import { Logger } from '@services/logging-service';
import { SnowballRssService } from '@services/rss/snowball/service';
import { ScreenShotService } from '@services/screenshot-service';
import { rssHubService } from '@services/rss/rsshub-service';
import { MailService } from '@services/mail-service';
import type { CommandModule } from 'yargs';
import * as path from 'path';
import dotenv from 'dotenv';
import { PostProducer } from '../post-producer';
import { PostConsumerForEmail } from '../post-consumer-email';
import { readVarsFromEnvs } from './read-envs';
import type { WorkResult } from '../scheduler';
import { Scheduler } from '../scheduler';
import type { Post } from '@services/rss/snowball/message';

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
  rssHubService.init({
    CACHE_TYPE: null,
    titleLengthLimit: 65535,
  });
  const snowballRssService = new SnowballRssService(rssHubService, logger);
  const screenshotService = new ScreenShotService(logger);
  const mailService = new MailService(
    {
      service: envVars.botEmailService,
      user: envVars.botEmailAddress,
      pass: envVars.botEmailPass,
    },
    logger,
  );
  const postProducer = new PostProducer({
    logger,
    snowballRssService,
  });
  const postConsumer = new PostConsumerForEmail({
    logger,
    screenshotService,
    mailService,
  });

  const postQueue: Post[] = [];
  if (args.sendTestEmail) {
    logger.info('sending dummy email to ensure auth success');
    await mailService.send({
      to: envVars.adminEmailAdress,
      subject: 'testing email service',
      text: 'This email may go to junk mail, remember to have a check there as well.',
    });
  }

  async function scheduledProducer(runCount: number): Promise<WorkResult> {
    const newPostsResult = await postProducer.produceNew(envVars.snowballUserId, {
      isFirstRun: runCount === 0,
    });
    if (!newPostsResult.isOk) {
      if (newPostsResult.error.kind === 'parse') {
        await mailService.send({
          to: envVars.adminEmailAdress,
          subject: 'snowball-rss is down due to parsing error',
          text: newPostsResult.error.message,
        });
        return { shouldContinue: false };
      }
      return { shouldContinue: true };
    }
    postQueue.push(...newPostsResult.value);
    return { shouldContinue: true };
  }

  const producerScheduler = new Scheduler({
    intervalSecond: args.intervalSecond,
    scheduledWork: scheduledProducer,
    logger,
    name: 'post producer',
    immediate: true,
  });
  producerScheduler.start();

  const consumerScheduler = new Scheduler({
    intervalSecond: 10,
    scheduledWork: async () => {
      postConsumer.consume(postQueue, envVars.subscribers);
      return { shouldContinue: true };
    },
    logger,
    name: 'post consumer for email',
  });
  consumerScheduler.start();
}

export const commandModule: CommandModule<{}, CliArgs> = {
  command: 'by-email',
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

export const deparactedCommandModule: CommandModule<{}, CliArgs> = {
  ...commandModule,
  command: '$0',
  deprecated: 'use $0 email instead',
};
