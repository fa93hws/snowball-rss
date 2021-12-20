import * as RSSHub from 'rsshub';
import { EOL } from 'os';
import { Message } from './message';
import { GlobalMutable } from './global';
import { Result } from './result';
import debug from 'debug';
import { config } from './config';
import { MailService } from './mailer';
import * as yargs from 'yargs';

type FetchError = {
  kind: 'parse' | 'network';
  message: string;
};

function fetch(): Promise<Result.Result<Message, FetchError>> {
  return new Promise((resolve) => {
    RSSHub.request(config.xueqiu.url)
      .then((rawMessage) => {
        const messageResult = Message.fromRaw(rawMessage);
        if (!messageResult.isOk) {
          process.stderr.write(messageResult.error + EOL);
          return resolve(
            Result.err({
              kind: 'parse',
              message: messageResult.error,
            }),
          );
        }
        return resolve(Result.ok(messageResult.value));
      })
      .catch((err) => {
        resolve(
          Result.err({
            message: err.toString(),
            kind: 'network',
          }),
        );
      });
  });
}

function createLogger(verbose: boolean) {
  const logger = debug('snwoball-rss');
  const log = logger.extend('info');
  log.enabled = true;
  const error = logger.extend('error');
  error.enabled = true;
  const warn = logger.extend('warn');
  warn.enabled = true;
  const logVerbose = logger.extend('verbose');
  logVerbose.enabled = verbose;
  return {
    log,
    error,
    warn,
    verbose: logVerbose,
  };
}

type CliArgs = {
  verbose: boolean;
  sendTestEmail: boolean;
  intervalSecond: number;
};

async function handler(args: CliArgs) {
  const { log, warn, error, verbose } = createLogger(args.verbose);
  const globalMutable = new GlobalMutable();
  RSSHub.init({
    CACHE_TYPE: null,
    titleLengthLimit: 65535,
  });
  log('logging into email service');
  const mailService = new MailService({
    service: config.mailer.service,
    user: config.mailer.sender.user,
    pass: config.mailer.sender.pass,
  });

  if (args.sendTestEmail) {
    log('sending dummy email to ensure auth success');
    const res = await mailService.send({
      to: config.mailer.adminEmail,
      subject: 'testing email service',
      text: 'This email may go to junk mail, remember to have a check there as well.',
    });
    if (!res.isOk) {
      error(res.error);
      return;
    } else {
      log(res.value);
    }
  }

  async function work() {
    log(`start fetching @${new Date()}`);
    const fetchResult = await fetch();
    if (!fetchResult.isOk) {
      process.stderr.write(fetchResult.error + EOL);
      if (fetchResult.error.kind === 'parse') {
        globalMutable.timer && clearInterval(globalMutable.timer);
        error(fetchResult.error.message);
        await mailService.send({
          to: config.mailer.adminEmail,
          subject: 'xueqiu-rss is down due to parsing error',
          text: fetchResult.error.message,
        });
        return;
      }
      warn(fetchResult.error.message);
      return;
    }

    log(`fetch success@${new Date()}}`);
    const message = fetchResult.value;
    verbose(`got message ${JSON.stringify(message)}`);
    const mailsToSend = message.posts
      .filter(
        (post) =>
          globalMutable.lastUpdateTime != null &&
          post.publishedTime > globalMutable.lastUpdateTime,
      )
      .map((post) => post.toMail(config.mailer.subscriber.join(', ')));
    const sendResult = await Promise.all(
      mailsToSend.map((mail) => mailService.send(mail)),
    );
    sendResult.forEach((result, idx) => {
      if (!result.isOk) {
        warn(
          `failed to send mail to ${mailsToSend[idx]}, error: ${result.error}`,
        );
      }
    });
    if (mailsToSend.length > 0) {
      log('mail sent');
    } else {
      log('nothing to send');
    }
    globalMutable.lastUpdateTime = message.updateTime;
  }
  work();
  globalMutable.timer = setInterval(work, args.intervalSecond * 1000);
}

export function main() {
  yargs
    .command('$0', 'start schdule fetching', {
      builder: (): yargs.Argv<CliArgs> =>
        yargs
          .option('verbose', {
            type: 'boolean',
            default: false,
            alias: 'v',
          })
          .option('sendTestEmail', {
            type: 'boolean',
            default: false,
          })
          .option('intervalSecond', {
            type: 'number',
            default: 60,
          }),
      handler,
    })
    .strict(true)
    .exitProcess(true)
    .demandCommand()
    .showHelpOnFail(false, 'Specify --help for available options')
    .help()
    .parse();
}
