import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { qqCommand } from '../src/command/qq/qq-command';

export function main() {
  return yargs(hideBin(process.argv))
    .command(qqCommand)
    .strict(true)
    .exitProcess(true)
    .demandCommand()
    .showHelpOnFail(false, 'Specify --help for available options')
    .help()
    .parse();
}

main();
