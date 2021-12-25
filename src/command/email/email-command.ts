import { Logger } from '@services/logging-service';
import { MailService } from '@services/notification/mail-service';
import { getRepoRoot } from '@utils/path';
import type { CommandModule } from 'yargs';
import * as path from 'path';
import dotenv from 'dotenv';
import type { PostWithScreenshot } from '../post-manager/producer';
import { PostConsumerForEmail } from './post-consumer-email';
import { readVarsFromEnvs } from './read-envs';
import { Scheduler } from '../scheduler';
import { startProducer } from '../post-manager/start-producer';
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
  const mailService = new MailService(
    {
      service: envVars.botEmailService,
      user: envVars.botEmailAddress,
      pass: envVars.botEmailPass,
    },
    logger,
  );
  const crashService = new EmailCrashService({ logger, mailService }, envVars.adminEmailAdress);
  const postConsumerForEmail = new PostConsumerForEmail(
    {
      logger,
      mailService,
    },
    envVars.subscribers,
  );

  if (args.sendTestEmail) {
    logger.info('sending dummy email to ensure auth success');
    await mailService.send({
      to: envVars.adminEmailAdress,
      subject: 'testing email service',
      text: 'This email may go to junk mail, remember to have a check there as well.',
    });
  }

  const postQueue: PostWithScreenshot[] = [];
  startProducer({
    intervalSecond: args.intervalSecond,
    snowballUserId: envVars.snowballUserId,
    postQueue,
    services: {
      logger,
      crashService,
    },
  });

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
