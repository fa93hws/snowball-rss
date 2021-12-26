import { Logger } from '@services/logging-service';
import type { CommandModule } from 'yargs';
import path from 'path';
import { getRepoRoot } from '@utils/path';
import type { PostWithScreenshot } from '../post-manager/producer';
import { startProducer } from '../post-manager/start-producer';
import { Scheduler } from '../scheduler';
import { QQService } from '@services/qq-service';
import type { ICrashService } from '@services/crash-service';

type CliArgs = {
  id: number;
  groupId: number;
  adminId: number;
  password?: string;
  snowballUserId: string;
  intervalSecond: number;
};

async function handler(args: CliArgs) {
  const logger = new Logger({ dirname: path.join(getRepoRoot(), 'logs', 'app') });
  const qqService = new QQService({ account: args.id, logger });
  await qqService.login(args.password);
  await qqService.sendMessageToUser(args.adminId, '群聊机器人已启动');
  const crashService: ICrashService = {
    async crash(reason: string) {
      await qqService.sendMessageToUser(args.adminId, '群聊机器人出错了，' + reason);
      process.exit(1);
    },
  };
  const consume = async (queue: PostWithScreenshot[]) => {
    for (let idx = 0; idx < queue.length; idx++) {
      const post = queue[idx];
      const image = post.screenshot?.content;
      if (image == null) {
        continue;
      }
      queue.splice(idx, 1);
      const result = await qqService.sendMessageToGroup(args.groupId, post.content, image);
      if (!result.isOk) {
        queue.push(post);
      }
      break;
    }
  };

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
      consume(postQueue);
      return { shouldContinue: true };
    },
    logger,
    name: 'post consumer for slack',
  });
  consumerScheduler.start();
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
      }),
  handler,
};
