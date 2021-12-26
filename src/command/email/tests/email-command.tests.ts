import yargs from 'yargs';
import { emailCommand } from '../email-command';

describe('emailCommandModule', () => {
  test('default values', async () => {
    const parser = yargs.command(emailCommand).strict(true).help();

    const parsedArgs = await new Promise<object>((resolve) => {
      parser.parse('by-email --do-not-run', {}, (_, argv) => {
        resolve(argv);
      });
    });
    expect(parsedArgs).toMatchObject({
      intervalSecond: 60,
      sendTestEmail: false,
      dotEnvFile: '.env',
    });
  });
});
