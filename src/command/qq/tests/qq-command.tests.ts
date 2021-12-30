import yargs from 'yargs';
import { qqCommand } from '../qq-command';

describe('qqCommandModule', () => {
  test('default values', async () => {
    const parser = yargs.command(qqCommand).strict(true).help();

    const parsedArgs = await new Promise<object>((resolve) => {
      parser.parse(
        'by-qq --id 1 --group-id 2 --admin-id 3 --snowball-user-id 5 --do-not-run',
        {},
        (_, argv) => {
          resolve(argv);
        },
      );
    });
    expect(parsedArgs).toMatchObject({
      intervalSecond: 60,
      groupId: 2,
      id: 1,
      adminId: 3,
      snowballUserId: '5',
    });
  });

  it('throws if id is not provided', async () => {
    const parser = yargs.command(qqCommand).strict(true).help();

    const p = new Promise<object>((resolve, reject) => {
      parser.parse(
        'by-qq --group-id 2 --admin-id 3 --snowball-user-id 5 --do-not-run',
        {},
        (err, argv) => {
          if (err) {
            return reject(err);
          }
          resolve(argv);
        },
      );
    });
    await expect(p).rejects.toThrow('id');
  });

  it('throws if group-id is not provided', async () => {
    const parser = yargs.command(qqCommand).strict(true).help();

    const p = new Promise<object>((resolve, reject) => {
      parser.parse(
        'by-qq --id 1  --admin-id 3 --snowball-user-id 5 --do-not-run',
        {},
        (err, argv) => {
          if (err) {
            return reject(err);
          }
          resolve(argv);
        },
      );
    });
    await expect(p).rejects.toThrow('groupId');
  });

  it('throws if admin-id is not provided', async () => {
    const parser = yargs.command(qqCommand).strict(true).help();

    const p = new Promise<object>((resolve, reject) => {
      parser.parse(
        'by-qq --id 1 --group-id 2 --snowball-user-id 5 --do-not-run',
        {},
        (err, argv) => {
          if (err) {
            return reject(err);
          }
          resolve(argv);
        },
      );
    });
    await expect(p).rejects.toThrow('adminId');
  });

  afterEach(async () => {
    // jimp want to import something asyncly.. we need to wait for it
    await new Promise(setImmediate);
  });
});
