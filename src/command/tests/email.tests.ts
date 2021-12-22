import yargs from 'yargs';
import { emailCommandModule } from '../email';

describe('emailCommandModule', () => {
  test('default values', async () => {
    const parser = yargs.command(emailCommandModule).strict(true).help();

    const parsedArgs = await new Promise<object>((resolve) => {
      parser.parse('', {}, (err, argv, output) => {
        resolve(argv);
      });
    });
    expect(parsedArgs).toMatchObject({
      intervalSecond: 60,
      sendTestEmail: false,
    });
  });
});
