import type { ILogger } from '@services/logging-service';

export const fakeLogger: ILogger = {
  logFileDirname: '',
  logFileName: '',
  info: () => undefined,
  error: () => undefined,
  warn: () => undefined,
  verbose: () => undefined,
  debug: () => undefined,
};
