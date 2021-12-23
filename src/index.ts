import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { commandModule, deparactedCommandModule } from './command/email/email-command';

export function main() {
  yargs(hideBin(process.argv))
    .command(commandModule)
    .command(deparactedCommandModule)
    .strict(true)
    .exitProcess(true)
    .demandCommand()
    .showHelpOnFail(false, 'Specify --help for available options')
    .help()
    .parse();
}

main();
