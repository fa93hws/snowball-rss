import { ScreenShotService } from '@services/screenshot-service';
import { Logger } from '@services/logging-service';
import { QQService } from '@services/qq-service';
import { fakeLogger } from '@services/fake/logging-service';
import { getRepoRoot } from '@utils/path';
import type { CommandModule } from 'yargs';
import path from 'path';
import { createHandler } from './consumer-handler';
import { Scheduler } from '../scheduler';
import type { PostWithScreenshot } from '../post-manager/producer';
import { PostConsumer } from '../post-manager/consumer';
import { startProducer } from '../post-manager/start-producer';
import { registerOnExit } from '../on-exit';
import { ExitHelper } from './exit-helper';
import { createWatermarkHandler } from './watermark';

type CliArgs = {
  id: number;
  groupId: number;
  adminId: number;
  password?: string;
  snowballUserId: string;
  intervalSecond: number;

  doNotRun: boolean;
  useFakeLogger: boolean;
};

async function handler(args: CliArgs) {
  if (args.doNotRun) {
    return;
  }
  const logger = args.useFakeLogger
    ? fakeLogger
    : new Logger({ dirname: path.join(getRepoRoot(), 'logs', 'app') });
  const qqService = new QQService({ account: args.id, logger });
  await qqService.login(args.password);
  await qqService.sendMessageToUser(args.adminId, '群聊机器人已启动');
  const exitHelper = new ExitHelper(qqService, logger, args.adminId);
  const consumerHandler = createHandler(qqService, args.groupId);
  const postConsumer = new PostConsumer(logger, consumerHandler);
  const screenshotService = new ScreenShotService({
    logger,
    exitHelper,
    addWatermark: createWatermarkHandler(args.groupId),
  });

  const postQueue: PostWithScreenshot[] = [];
  startProducer({
    intervalSecond: args.intervalSecond,
    snowballUserId: args.snowballUserId,
    postQueue,
    services: {
      logger,
      exitHelper,
      screenshotService,
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

  registerOnExit(logger, exitHelper);
}

export const qqCommand: CommandModule<{}, CliArgs> = {
  command: 'by-qq',
  describe: 'schedule fetching from snowball rss and notifiy subscribers in qq qun',
  builder: (yargs) =>
    yargs
      .option('id', {
        type: 'number',
        describe: 'bot qq id',
        demandOption: true,
      })
      .option('password', {
        type: 'string',
        describe: 'passowrd for bot qq, if not specified, will login using qr code',
      })
      .option('groupId', {
        type: 'number',
        describe: 'qq qun id to send notification',
        demandOption: true,
      })
      .option('adminId', {
        type: 'number',
        describe: 'admin qq account to send test message or status update',
        demandOption: true,
      })
      .option('intervalSecond', {
        type: 'number',
        describe: 'how often fetching is happened, in second',
        default: 60,
      })
      .option('snowballUserId', {
        type: 'string',
        describe: 'snowball user id',
        demandOption: true,
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
