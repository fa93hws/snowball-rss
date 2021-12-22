import { fakeLogger } from '@services/fake/logging-service';
import { GlobalMutable } from '../global';

describe('GlobalMutable', () => {
  describe('lastUpdateTime', () => {
    it('is empty by default', () => {
      const g = new GlobalMutable(fakeLogger);
      expect(g.lastUpdateTime).toBeUndefined();
    });

    it('set value for lastUpdateTime', () => {
      const g = new GlobalMutable(fakeLogger);
      const date = new Date();
      g.setLastUpdateTime(date);
      expect(g.lastUpdateTime).toEqual(date);
    });
  });
});
