import { Logger } from '@services/logging-service';
import { getRepoRoot } from '@utils/path';
import type { CommandModule } from 'yargs';
import dotenv from 'dotenv';
import * as path from 'path';
import { readVarsFromEnvs } from './read-envs';

type CliArgs = {
  notificationChannel: string;
  statusChannel: string;
  intervalSecond: number;
  dotEnvFile: string;
  doNotRun: boolean;
};

async function handler(args: CliArgs) {
  if (args.doNotRun) {
    return;
  }
  const logger = new Logger({ dirname: path.join(getRepoRoot(), 'logs', 'app') });
  logger.debug(`Loading dotenv file: ${args.dotEnvFile}`);
  dotenv.config({ path: args.dotEnvFile });
  readVarsFromEnvs();
}

export const slackCommand: CommandModule<{}, CliArgs> = {
  command: 'by-slack',
  describe: 'schedule fetching from snowball rss and notifiy subscribers in slack channel',
  builder: (yargs) =>
    yargs
      .option('notificationChannel', {
        type: 'string',
        describe: 'channel id to send notification for subscribers',
        demandOption: true,
      })
      .option('statusChannel', {
        type: 'string',
        describe: 'channel id to send status related message (service down, error report etc)',
        demandOption: true,
      })
      .option('intervalSecond', {
        type: 'number',
        describe: 'how often fetching is happened, in second',
        default: 60,
      })
      .option('dotEnvFile', {
        type: 'string',
        describe: 'path to .env file',
        default: '.env',
      })
      .option('doNotRun', {
        type: 'boolean',
        describe: 'if true, handler will not be called. For test purpose only!',
        default: false,
      }),
  handler,
};
