import yargs from 'yargs';
import { slackCommand } from '../slack-command';

describe('slackCommandModule', () => {
  test('default values', async () => {
    const parser = yargs.command(slackCommand).strict(true).help();

    const parsedArgs = await new Promise<object>((resolve) => {
      parser.parse(
        'by-slack --notification-channel nc --status-channel sc --do-not-run',
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
      parser.parse('by-slack --status-channel sc --do-not-run', {}, (err, argv) => {
        if (err) {
          return reject(err);
        }
        resolve(argv);
      });
    });
    await expect(p).rejects.toThrow('notificationChannel');
  });

  it('throws if status-channel is not provided', async () => {
    const parser = yargs.command(slackCommand).strict(true).help();

    const p = new Promise<object>((resolve, reject) => {
      parser.parse('by-slack --notification-channel nc --do-not-run', {}, (err, argv) => {
        if (err) {
          return reject(err);
        }
        resolve(argv);
      });
    });
    await expect(p).rejects.toThrow('statusChannel');
  });
});
