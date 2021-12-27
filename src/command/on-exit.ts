import type { IExitHelper } from '@services/exit-helper';
import type { ILogger } from '@services/logging-service';

export function registerOnExit(logger: ILogger, exitHelper: IExitHelper) {
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
      await exitHelper.onExpectedExit(sig);
    });
  });
}
