import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  commandModule as emailCommand,
  deparactedCommandModule,
} from './command/email/email-command';
import { commandModule as slackCommand } from './command/slack/slack';

export function main() {
  yargs(hideBin(process.argv))
    .command(emailCommand)
    .command(deparactedCommandModule)
    .command(slackCommand)
    .strict(true)
    .exitProcess(true)
    .demandCommand()
    .showHelpOnFail(false, 'Specify --help for available options')
    .help()
    .parse();
}

main();
