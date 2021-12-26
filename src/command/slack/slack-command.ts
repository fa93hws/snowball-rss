import { Logger } from '@services/logging-service';
import { getRepoRoot } from '@utils/path';
import type { CommandModule } from 'yargs';
import dotenv from 'dotenv';
import * as path from 'path';
import { readVarsFromEnvs } from './read-envs';
import { SlackService } from '@services/slack-service';
import { SlackCrashService } from '@services/crash-service';
import { PostConsumerForSlack } from './post-consumer';
import type { PostWithScreenshot } from '../post-manager/producer';
import { startProducer } from '../post-manager/start-producer';
import { Scheduler } from '../scheduler';

type CliArgs = {
  notificationChannel: string;
  statusChannel: string;
  intervalSecond: number;
  dotEnvFile: string;
  doNotRun: boolean;
  snowballUserId: string;
};

async function handler(args: CliArgs) {
  if (args.doNotRun) {
    return;
  }
  const logger = new Logger({ dirname: path.join(getRepoRoot(), 'logs', 'app') });
  logger.debug(`Loading dotenv file: ${args.dotEnvFile}`);
  dotenv.config({ path: args.dotEnvFile });
  const envVars = readVarsFromEnvs();
  const slackService = new SlackService({
    botUserToken: envVars.botUserToken,
    userToken: envVars.userToken,
    logger,
  });
  const crashService = new SlackCrashService({ logger, slackService }, args.statusChannel);
  const postConsumerForSlack = new PostConsumerForSlack(
    {
      logger,
      slackService,
    },
    args.notificationChannel,
  );

  slackService.postSimpleMessage({
    channel: args.statusChannel,
    abstract: '服务上线',
    text: 'servce up',
  });

  const postQueue: PostWithScreenshot[] = [];
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
      postConsumerForSlack.consume(postQueue);
      return { shouldContinue: true };
    },
    logger,
    name: 'post consumer for slack',
  });
  consumerScheduler.start();

  [
    'SIGHUP',
    'SIGINT',
    'SIGQUIT',
    'SIGILL',
    'SIGTRAP',
    'SIGABRT',
    'SIGBUS',
    'SIGFPE',
    'SIGUSR1',
    'SIGSEGV',
    'SIGUSR2',
    'SIGTERM',
  ].forEach(function (sig) {
    process.on(sig, async function () {
      logger.info('service down from signal: ' + sig);
      await slackService.postSimpleMessage({
        channel: args.statusChannel,
        abstract: '服务下线',
        text: 'servce down',
      });
      process.exit(1);
    });
  });
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
      .option('doNotRun', {
        type: 'boolean',
        describe: 'if true, handler will not be called. For test purpose only!',
        default: false,
      }),
  handler,
};
