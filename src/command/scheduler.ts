import { ILogger } from '@services/logging-service';

interface IScheduler {
  start(): void;
  stop(): void;
}

export type WorkResult = {
  shouldContinue: boolean;
};
export type ScheduledWork = () => Promise<WorkResult> | WorkResult;
/**
 * Why scheduler stops. It will not be called if the scheduler is stopped.
 * "failed" means scheduleWork return a promise that is rejected.
 * "manual" means `stop` is called manually.
 * "workResult" means scheduleWork return a promise that is resolved with `shouldContinue` = false.
 */
type StopReason = 'failed' | 'manual' | 'workResult';

export class Scheduler implements IScheduler {
  private readonly intervalMs: number;
  private readonly immediate: boolean;
  private readonly scheduledWork: ScheduledWork;
  private readonly logger: ILogger;
  // called just before scheduledWork is called
  // runCount: How many time it has been run before
  private readonly beforeRun?: (runCount: number) => void;
  private readonly onStop?: (reason: StopReason) => void;
  // name of the sheduler, used in logging only.
  private readonly name: string;

  private timer: NodeJS.Timer | undefined;

  constructor(options: {
    intervalSecond: number;
    immediate?: boolean;
    scheduledWork: ScheduledWork;
    logger: ILogger;
    name?: string;
    beforeRun?: (runCount: number) => void;
    onStop?: (reason: StopReason) => void;
  }) {
    this.intervalMs = options.intervalSecond * 1000;
    this.immediate = options.immediate ?? false;
    this.scheduledWork = options.scheduledWork;
    this.logger = options.logger;
    this.name = options.name ?? 'unnamed';
    this.beforeRun = options.beforeRun;
    this.onStop = options.onStop;
  }

  // runCount: How many time it has been run
  private schedule(runCount: number): Promise<WorkResult> {
    return new Promise(async (resolve) => {
      this.timer = setTimeout(async () => {
        try {
          this.beforeRun && this.beforeRun(runCount);
          const workResult = await this.scheduledWork();
          resolve(workResult);
        } catch (e) {
          this.logger.error(
            `scheduler "${this.name}" have to stop due to error in scheduled work, error is:`,
          );
          this.logger.error(e);
          this.onStop && this.onStop('failed');
          resolve({ shouldContinue: false });
        } finally {
          this.timer = undefined;
        }
      }, this.intervalMs);
    });
  }

  private async scheduleRecursively(runCount: number): Promise<void> {
    const result = await this.schedule(runCount);
    if (result.shouldContinue) {
      this.logger.verbose(`schedluer "${this.name}" can continue`);
      this.scheduleRecursively(runCount + 1);
    } else {
      this.onStop && this.onStop('workResult');
      this.logger.info(`shceduler "${this.name}" will stop`);
    }
  }

  async start(): Promise<void> {
    if (this.immediate) {
      this.beforeRun && this.beforeRun(0);
      const workResult = await this.scheduledWork();
      if (!workResult.shouldContinue) {
        this.onStop && this.onStop('workResult');
        return;
      }
      this.scheduleRecursively(1);
    } else {
      this.scheduleRecursively(0);
    }
  }

  stop(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.onStop && this.onStop('manual');
    }
  }
}
