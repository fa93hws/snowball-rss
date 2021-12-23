import { Logger } from '@services/logging-service';
import { SnowballRssService } from '@services/rss/snowball/service';
import { ScreenShotService } from '@services/screenshot-service';
import { MailService } from '@services/mail-service';
import { getRepoRoot } from '@utils/path';
import type { CommandModule } from 'yargs';
import * as path from 'path';
import dotenv from 'dotenv';
import type { PostWithScreenshot } from '../post-manager/producer';
import { PostProducer } from '../post-manager/producer';
import { PostConsumerForEmail } from './post-consumer-email';
import { readVarsFromEnvs } from './read-envs';
import type { WorkResult } from '../scheduler';
import { Scheduler } from '../scheduler';
import { PostConsumerScreenshot } from '../post-manager/consumer-screenshot';
import { EmailCrashService } from '@services/crash-service';

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
  const logger = new Logger({ dirname: path.join(getRepoRoot(), 'logs', 'app') });
  logger.debug(`Loading dotenv file: ${args.dotEnvFile}`);
  dotenv.config({ path: args.dotEnvFile });
  const envVars = readVarsFromEnvs();
  /**
   * rsshub is using dotenv.config(), so we have to have the import happens after our dotenv.config
   * so that we can config which env files we want to use.
   */
  const { rssHubService } = await import('@services/rss/rsshub-service');
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
  const crashService = new EmailCrashService({ logger, mailService }, envVars.adminEmailAdress);
  const postProducer = new PostProducer({
    crashService,
    logger,
    snowballRssService,
  });
  const postConsumerForScreenshot = new PostConsumerScreenshot({
    logger,
    screenshotService,
  });
  const postConsumerForEmail = new PostConsumerForEmail(
    {
      logger,
      mailService,
    },
    envVars.subscribers,
  );

  const postQueue: PostWithScreenshot[] = [];
  if (args.sendTestEmail) {
    logger.info('sending dummy email to ensure auth success');
    await mailService.send({
      to: envVars.adminEmailAdress,
      subject: 'testing email service',
      text: 'This email may go to junk mail, remember to have a check there as well.',
    });
  }

  async function scheduledProducer(runCount: number): Promise<WorkResult> {
    const newPosts = await postProducer.produceNew(envVars.snowballUserId, {
      isFirstRun: runCount === 0,
    });
    postQueue.push(...newPosts);
    postConsumerForScreenshot.consume(postQueue);
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
      postConsumerForEmail.consume(postQueue);
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
        default: '.env',
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
