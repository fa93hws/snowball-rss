import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { qqCommand } from '../src/command/qq/qq-command';
import { emailCommand, deparactedEmailCommand } from './command/email/email-command';
import { slackCommand } from './command/slack/slack-command';

export function main() {
  return yargs(hideBin(process.argv))
    .command(emailCommand)
    .command(deparactedEmailCommand)
    .command(slackCommand)
    .command(qqCommand)
    .strict(true)
    .exitProcess(true)
    .demandCommand()
    .showHelpOnFail(false, 'Specify --help for available options')
    .help()
    .parse();
}

main();
