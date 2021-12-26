import { fakeLogger } from '@services/fake/logging-service';
import { registerOnExit } from '../on-exit';

describe('registerOnExit', () => {
  const handler = jest.fn();
  const fakeExit = jest.spyOn(process, 'exit').mockImplementation(() => void 0 as any as never);
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
    registerOnExit(fakeLogger, handler);
  });

  it.each(signals)('signal %s will be caught', async (signal) => {
    process.emit(signal, signal);
    await new Promise(setImmediate);
    expect(handler).toHaveBeenCalled();
    expect(fakeExit).toHaveBeenCalled();
  });

  afterEach(() => {
    handler.mockClear();
    fakeExit.mockClear();
  });

  afterAll(() => {
    fakeExit.mockRestore();
  });

  afterAll(() => {
    signals.forEach((signal) => {
      process.removeListener(signal, handler);
    });
  });
});
