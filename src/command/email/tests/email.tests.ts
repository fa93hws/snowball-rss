import yargs from 'yargs';
import { commandModule } from '../email-command';

describe('commandModule', () => {
  test('default values', async () => {
    const parser = yargs.command(commandModule).strict(true).help();

    const parsedArgs = await new Promise<object>((resolve) => {
      parser.parse('--do-not-run', {}, (_, argv) => {
        resolve(argv);
      });
    });
    expect(parsedArgs).toMatchObject({
      intervalSecond: 60,
      sendTestEmail: false,
    });
  });
});
