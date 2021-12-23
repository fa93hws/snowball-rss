import { fakeLogger } from '@services/fake/logging-service';
import { Scheduler } from '../scheduler';

describe('scheduler', () => {
  const scheduledWork = jest.fn();

  // there are quite a few await in implementation of scheduler,
  // we need to flush them so that fake timer can work properly.
  async function flushNPromises(n: number) {
    for (let idx = 0; idx < n; idx++) {
      await Promise.resolve();
    }
  }

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    scheduledWork.mockRestore();
  });

  describe('start', () => {
    it('execute immediate when immediate is true', async () => {
      scheduledWork.mockReturnValue({ shouldContinue: false });
      const onStop = jest.fn();
      const scheduler = new Scheduler({
        intervalSecond: 1,
        immediate: true,
        scheduledWork,
        logger: fakeLogger,
        onStop,
      });
      scheduler.start();
      await flushNPromises(5);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      expect(scheduledWork).toHaveBeenCalledWith(0);
      expect(onStop).toHaveBeenCalledWith('workResult');
    });

    it('will not execute immediate when immediate is not set', () => {
      scheduledWork.mockReturnValue({ shouldContinue: false });
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
      });
      scheduler.start();
      jest.advanceTimersByTime(999);
      expect(scheduledWork).not.toHaveBeenCalled();
    });

    it('will execute after given interval', () => {
      scheduledWork.mockReturnValue({ shouldContinue: false });
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
      });
      scheduler.start();
      jest.advanceTimersByTime(999);
      expect(scheduledWork).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      expect(scheduledWork).toHaveBeenCalledWith(0);
    });

    it('will continue if work result shows it can continue', async () => {
      scheduledWork.mockReturnValue({ shouldContinue: true });
      const onStop = jest.fn();
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
        onStop,
      });
      scheduler.start();
      jest.advanceTimersByTime(999);
      expect(scheduledWork).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      await flushNPromises(5);
      jest.advanceTimersByTime(900);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(200);
      expect(scheduledWork).toHaveBeenCalledTimes(2);
      expect(onStop).not.toHaveBeenCalled();
      expect(scheduledWork).toHaveBeenCalledWith(0);
      expect(scheduledWork).toHaveBeenCalledWith(1);
    });

    it('stops when result indicates it can not continue', async () => {
      scheduledWork.mockReturnValue({ shouldContinue: false });
      const onStop = jest.fn();
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
        onStop,
      });
      scheduler.start();
      jest.advanceTimersByTime(999);
      expect(scheduledWork).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      await flushNPromises(5);
      jest.advanceTimersByTime(900);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(200);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      expect(onStop).toHaveBeenCalledWith('workResult');
    });

    it('stops when promise rejects', async () => {
      scheduledWork.mockRejectedValue('123');
      const onStop = jest.fn();
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
        onStop,
      });
      scheduler.start();
      jest.advanceTimersByTime(999);
      expect(scheduledWork).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      await flushNPromises(10);
      jest.advanceTimersByTime(900);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(200);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      expect(onStop).toHaveBeenCalledWith('failed');
    });
  });

  describe('stop', () => {
    it('stops the scheduler', async () => {
      scheduledWork.mockReturnValue({ shouldContinue: true });
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
      });
      scheduler.start();
      jest.advanceTimersByTime(999);
      expect(scheduledWork).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      await flushNPromises(5);
      jest.advanceTimersByTime(900);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1000);
      expect(scheduledWork).toHaveBeenCalledTimes(2);
      await flushNPromises(5);
      jest.advanceTimersByTime(1000);
      expect(scheduledWork).toHaveBeenCalledTimes(3);
      await flushNPromises(5);
      scheduler.stop();
      jest.advanceTimersByTime(1000);
      expect(scheduledWork).toHaveBeenCalledTimes(3);
    });
  });

  describe('onContinue', () => {
    it('records how many times scheduledWork has been called when immediate is true', async () => {
      const beforeRun = jest.fn();
      scheduledWork.mockReturnValue({ shouldContinue: true });
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
        beforeRun,
        immediate: true,
      });
      scheduler.start();
      await flushNPromises(5);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1001);
      await flushNPromises(5);
      expect(scheduledWork).toHaveBeenCalledTimes(2);
      expect(beforeRun).toHaveBeenCalledTimes(2);
      expect(beforeRun).toHaveBeenNthCalledWith(1, 0);
      expect(beforeRun).toHaveBeenNthCalledWith(2, 1);
    });

    it('records how many times scheduledWork has been called when immediate is false', async () => {
      const beforeRun = jest.fn();
      scheduledWork.mockReturnValue({ shouldContinue: true });
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
        beforeRun,
      });
      scheduler.start();
      jest.advanceTimersByTime(999);
      expect(scheduledWork).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      await flushNPromises(5);
      jest.advanceTimersByTime(900);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(200);
      expect(scheduledWork).toHaveBeenCalledTimes(2);
      expect(beforeRun).toHaveBeenCalledTimes(2);
      expect(beforeRun).toHaveBeenNthCalledWith(1, 0);
      expect(beforeRun).toHaveBeenNthCalledWith(2, 1);
    });
  });

  describe('onStop', () => {
    it('will not call onStop if the scheduler is stopped', async () => {
      scheduledWork.mockReturnValue({ shouldContinue: false });
      const onStop = jest.fn();
      const scheduler = new Scheduler({
        intervalSecond: 1,
        scheduledWork,
        logger: fakeLogger,
        onStop,
      });
      scheduler.start();
      jest.advanceTimersByTime(999);
      expect(scheduledWork).not.toHaveBeenCalled();
      jest.advanceTimersByTime(2);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      await flushNPromises(5);
      jest.advanceTimersByTime(900);
      expect(scheduledWork).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1000);
      scheduler.stop();
      expect(onStop).not.toHaveBeenCalledWith('manual');
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });
});
