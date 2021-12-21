import { takeScreenShot } from '../screenshot';

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('screenshot', () => {
  jest.setTimeout(60000);
  it('take a screenshot for a given url', async () => {
    const url = 'https://xueqiu.com/6784593966/206619107';
    const bufferResult = await takeScreenShot(url);
    if (bufferResult.isOk === false) {
      throw bufferResult.error;
    }
    expect(bufferResult.isOk).toBe(true);
  });
});
