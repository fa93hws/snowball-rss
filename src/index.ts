import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { emailCommand, deparactedEmailCommand } from './command/email/email-command';
import { slackCommand } from './command/slack/slack-command';

export function main() {
  yargs(hideBin(process.argv))
    .command(emailCommand)
    .command(deparactedEmailCommand)
    .command(slackCommand)
    .strict(true)
    .exitProcess(true)
    .demandCommand()
    .showHelpOnFail(false, 'Specify --help for available options')
    .help()
    .parse();
}

main();
