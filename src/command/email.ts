import type { CommandModule, Argv } from 'yargs';

type CliArgs = {
  sendTestEmail: boolean;
  intervalSecond: number;
};

export const emailCommandModule: CommandModule = {
  command: '$0',
  describe:
    'schedule fetching from xueqiu rss and notifiy subscribers by email',
  builder: (yargs): Argv<CliArgs> =>
    yargs
      .option('sendTestEmail', {
        type: 'boolean',
        default: false,
      })
      .option('intervalSecond', {
        type: 'number',
        default: 60,
      }),
  handler: () => {
    return;
  },
};
