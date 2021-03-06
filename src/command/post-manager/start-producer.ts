import type { ILogger } from '@services/logging-service';
import type { IRssHubService } from '@services/rss/rsshub-service';
import { SnowballRssService } from '@services/rss/snowball/service';
import type { IScreenShotService } from '@services/screenshot-service';
import type { IExitHelper } from '@services/exit-helper';
import type { WorkResult } from '../scheduler';
import { Scheduler } from '../scheduler';
import { PostConsumerScreenshot } from './consumer-screenshot';
import type { PostWithScreenshot } from './producer';
import { PostProducer } from './producer';

export async function startProducer(params: {
  intervalSecond: number;
  snowballUserId: string;
  postQueue: PostWithScreenshot[];
  services: {
    logger: ILogger;
    exitHelper: IExitHelper;
    screenshotService: IScreenShotService;
    // for stubbing
    rssHubService?: IRssHubService;
  };
}) {
  const { intervalSecond, snowballUserId, postQueue, services } = params;
  const { logger, exitHelper } = services;
  /**
   * rsshub is using dotenv.config(), so we have to have the import happens after our dotenv.config
   * so that we can config which env files we want to use.
   */
  const rssHubService =
    services?.rssHubService ?? (await import('@services/rss/rsshub-service')).rssHubService;
  rssHubService.init({
    CACHE_TYPE: null,
    titleLengthLimit: 65535,
  });
  const snowballRssService = new SnowballRssService(rssHubService, logger);
  const postProducer = new PostProducer({
    exitHelper,
    logger,
    snowballRssService,
  });
  const postConsumerForScreenshot = new PostConsumerScreenshot({
    logger,
    screenshotService: services.screenshotService,
  });

  async function scheduledWork(runCount: number): Promise<WorkResult> {
    const newPosts = await postProducer.produceNew(snowballUserId, {
      isFirstRun: runCount === 0,
    });
    postQueue.push(...newPosts);
    postConsumerForScreenshot.consume(postQueue);
    return { shouldContinue: true };
  }

  const producerScheduler = new Scheduler({
    intervalSecond,
    scheduledWork,
    logger,
    name: 'post producer',
    immediate: true,
  });
  producerScheduler.start();
}
