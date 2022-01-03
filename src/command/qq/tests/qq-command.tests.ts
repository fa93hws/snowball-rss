import yargs from 'yargs';
import { qqCommand } from '../qq-command';

describe('qqCommandModule', () => {
  test('default values', async () => {
    const parser = yargs.command(qqCommand).strict(true).help();

    const parsedArgs = await new Promise<object>((resolve) => {
      parser.parse('--do-not-run', {}, (_, argv) => {
        resolve(argv);
      });
    });
    expect(parsedArgs).toMatchObject({
      intervalSecond: 60,
    });
  });

  afterEach(async () => {
    // jimp want to import something asyncly.. we need to wait for it
    await new Promise(setImmediate);
  });
});
