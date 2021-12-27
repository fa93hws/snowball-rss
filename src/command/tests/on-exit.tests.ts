import type { IExitHelper } from '@services/exit-helper';
import { fakeLogger } from '@services/fake/logging-service';
import { registerOnExit } from '../on-exit';

describe('registerOnExit', () => {
  const handler = jest.fn();
  const exitHelper: IExitHelper = {
    onExpectedExit: handler,
    onUnexpectedExit: jest.fn(),
  };
  const signals = [
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
  ] as const;

  beforeAll(() => {
    registerOnExit(fakeLogger, exitHelper);
  });

  it.each(signals)('signal %s will be caught', async (signal) => {
    process.emit(signal, signal);
    await new Promise(setImmediate);
    expect(handler).toHaveBeenCalled();
  });

  afterEach(() => {
    handler.mockClear();
  });

  afterAll(() => {
    signals.forEach((signal) => {
      process.removeListener(signal, handler);
    });
  });
});
