import yargs from 'yargs';
import { slackCommand } from '../slack-command';

describe('slackCommandModule', () => {
  jest.useFakeTimers();

  test('default values', async () => {
    const parser = yargs.command(slackCommand).strict(true).help();

    const parsedArgs = await new Promise<object>((resolve) => {
      parser.parse(
        'by-slack --notification-channel nc --status-channel sc --snowball-user-id 123 --do-not-run',
        {},
        (_, argv) => {
          resolve(argv);
        },
      );
    });
    expect(parsedArgs).toMatchObject({
      intervalSecond: 60,
      notificationChannel: 'nc',
      statusChannel: 'sc',
      dotEnvFile: '.env',
    });
  });

  it('throws if notification-channel is not provided', async () => {
    const parser = yargs.command(slackCommand).strict(true).help();

    const p = new Promise<object>((resolve, reject) => {
      parser.parse(
        'by-slack --status-channel sc --snowball-user-id 123 --do-not-run',
        {},
        (err, argv) => {
          if (err) {
            return reject(err);
          }
          resolve(argv);
        },
      );
    });
    await expect(p).rejects.toThrow('notificationChannel');
  });

  it('throws if status-channel is not provided', async () => {
    const parser = yargs.command(slackCommand).strict(true).help();

    const p = new Promise<object>((resolve, reject) => {
      parser.parse(
        'by-slack --notification-channel nc --snowball-user-id 123 --do-not-run',
        {},
        (err, argv) => {
          if (err) {
            return reject(err);
          }
          resolve(argv);
        },
      );
    });
    await expect(p).rejects.toThrow('statusChannel');
  });

  it('throws if snowball-user-id is not provided', async () => {
    const parser = yargs.command(slackCommand).strict(true).help();

    const p = new Promise<object>((resolve, reject) => {
      parser.parse(
        'by-slack --notification-channel nc --status-channel sc --do-not-run',
        {},
        (err, argv) => {
          if (err) {
            return reject(err);
          }
          resolve(argv);
        },
      );
    });
    await expect(p).rejects.toThrow('snowballUserId');
  });

  it('is able to run initially', async () => {
    const parser = yargs.command(slackCommand).strict(true).help();
    expect(() =>
      parser.parse(
        'by-slack --notification-channel nc --status-channel sc --snowball-user-id 123 --use-fake-logger',
      ),
    ).not.toThrow();
    jest.clearAllTimers();
  });
});
