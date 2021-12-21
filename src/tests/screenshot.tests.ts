import { takeScreenShot } from '../screenshot';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('screenshot', () => {
  jest.setTimeout(60000);
  it('take a screenshot for a given url', async () => {
    const url = 'https://xueqiu.com/6784593966/206626032';
    const bufferResult = await takeScreenShot(url);
    if (bufferResult.isOk === false) {
      throw bufferResult.error;
    }
    fs.writeFileSync(
      path.join(__dirname, 'screenshot.jpeg'),
      bufferResult.value,
      { encoding: 'binary' },
    );
    expect(bufferResult.isOk).toBe(true);
  });
});
