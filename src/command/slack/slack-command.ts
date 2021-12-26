import { Logger } from '@services/logging-service';
import { SlackService } from '@services/slack-service';
import { SlackCrashService } from '@services/crash-service';
import { fakeLogger } from '@services/fake/logging-service';
import { getRepoRoot } from '@utils/path';
import type { CommandModule } from 'yargs';
import dotenv from 'dotenv';
import * as path from 'path';
import { createhandler } from './consumer-handler';
import { readVarsFromEnvs } from './read-envs';
import { PostConsumer } from '../post-manager/consumer';
import type { PostWithScreenshot } from '../post-manager/producer';
import { startProducer } from '../post-manager/start-producer';
import { Scheduler } from '../scheduler';
import { registerOnExit } from '../on-exit';

type CliArgs = {
  notificationChannel: string;
  statusChannel: string;
  intervalSecond: number;
  dotEnvFile: string;
  doNotRun: boolean;
  snowballUserId: string;
  useFakeLogger: boolean;
};

async function handler(args: CliArgs) {
  if (args.doNotRun) {
    return;
  }
  const logger = args.useFakeLogger
    ? fakeLogger
    : new Logger({ dirname: path.join(getRepoRoot(), 'logs', 'app') });
  logger.debug(`Loading dotenv file: ${args.dotEnvFile}`);
  dotenv.config({ path: args.dotEnvFile });
  const envVars = readVarsFromEnvs();
  const slackService = new SlackService({
    botUserToken: envVars.botUserToken,
    userToken: envVars.userToken,
    logger,
  });
  const crashService = new SlackCrashService({ logger, slackService }, args.statusChannel);
  const postQueue: PostWithScreenshot[] = [];
  const consumerHandler = createhandler(slackService, args.notificationChannel);
  const postConsumer = new PostConsumer(logger, consumerHandler);

  slackService.postSimpleMessage({
    channel: args.statusChannel,
    abstract: '服务上线',
    text: 'Service up',
  });

  startProducer({
    intervalSecond: args.intervalSecond,
    snowballUserId: args.snowballUserId,
    postQueue,
    services: {
      logger,
      crashService,
    },
  });

  const consumerScheduler = new Scheduler({
    intervalSecond: 10,
    scheduledWork: async () => {
      postConsumer.consumeOne(postQueue);
      return { shouldContinue: true };
    },
    logger,
    name: 'post consumer for slack',
  });
  consumerScheduler.start();

  registerOnExit(logger, (sig: string) => crashService.crash('receiving ' + sig));
}

export const slackCommand: CommandModule<{}, CliArgs> = {
  command: 'by-slack',
  describe: 'schedule fetching from snowball rss and notifiy subscribers in slack channel',
  builder: (yargs) =>
    yargs
      .option('notificationChannel', {
        type: 'string',
        describe: 'channel id to send notification for subscribers',
        demandOption: true,
      })
      .option('statusChannel', {
        type: 'string',
        describe: 'channel id to send status related message (service down, error report etc)',
        demandOption: true,
      })
      .option('snowballUserId', {
        type: 'string',
        describe: 'snowball user id',
        demandOption: true,
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
      .option('useFakeLogger', {
        type: 'boolean',
        describe: 'if true, fake logger will be used. For test purpose only!',
        default: false,
      })
      .option('doNotRun', {
        type: 'boolean',
        describe: 'if true, handler will not be called. For test purpose only!',
        default: false,
      }),
  handler,
};
