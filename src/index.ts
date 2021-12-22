import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { commandModule } from './command/email';

export function main() {
  yargs(hideBin(process.argv))
    .command(commandModule)
    .strict(true)
    .exitProcess(true)
    .demandCommand()
    .showHelpOnFail(false, 'Specify --help for available options')
    .help()
    .parse();
}

main();
