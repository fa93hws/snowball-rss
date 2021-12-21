import * as RSSHub from 'rsshub';
import { EOL } from 'os';
import { Message } from './message';
import { GlobalMutable } from './global';
import { Result } from './result';
import { config } from './config';
import { MailService } from './mailer';
import * as yargs from 'yargs';
import { Logger } from './logger';

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

type CliArgs = {
  sendTestEmail: boolean;
  intervalSecond: number;
};

async function handler(args: CliArgs) {
  const logger = new Logger();
  const globalMutable = new GlobalMutable();
  const subscribers = config.mailer.subscriber.join(', ');
  RSSHub.init({
    CACHE_TYPE: null,
    titleLengthLimit: 65535,
  });
  logger.info('logging into email service');
  const mailService = new MailService({
    service: config.mailer.service,
    user: config.mailer.sender.user,
    pass: config.mailer.sender.pass,
  });

  if (args.sendTestEmail) {
    logger.info('sending dummy email to ensure auth success');
    const res = await mailService.send({
      to: config.mailer.adminEmail,
      subject: 'testing email service',
      text: 'This email may go to junk mail, remember to have a check there as well.',
    });
    if (!res.isOk) {
      logger.error('failed to send test email, error:');
      logger.error(res.error);
      return;
    } else {
      logger.info('managed to send email, reply from server:');
      logger.info(res.value);
    }
  }

  async function work() {
    logger.info('start fetching');
    const fetchResult = await fetch();
    if (!fetchResult.isOk) {
      process.stderr.write(fetchResult.error + EOL);
      if (fetchResult.error.kind === 'parse') {
        globalMutable.timer && clearInterval(globalMutable.timer);
        logger.error('parsing error:');
        logger.error(fetchResult.error.message);
        await mailService.send({
          to: config.mailer.adminEmail,
          subject: 'xueqiu-rss is down due to parsing error',
          text: fetchResult.error.message,
        });
        return;
      }
      logger.error('fetch failed');
      logger.error(fetchResult.error.message);
      return;
    }

    logger.info('fetch success');
    const message = fetchResult.value;
    logger.debug(`got message from ${config.xueqiu.url}`);
    logger.debug({
      time: message.updateTime,
      posts: message.posts.map((p) => p.title.substring(0, 18)),
    });
    const mailsToSend = message.posts
      .filter(
        (post) =>
          globalMutable.lastUpdateTime != null &&
          post.publishedTime > globalMutable.lastUpdateTime,
      )
      .map((post) => post.toMail(subscribers));
    const sendResult = await Promise.all(
      mailsToSend.map((mail) => mailService.send(mail)),
    );
    sendResult.forEach((result, idx) => {
      if (!result.isOk) {
        logger.error('failed to send mail, mail content:');
        logger.error(mailsToSend[idx]);
        logger.error('error from email service is:');
        logger.error(result.error);
      }
    });
    if (mailsToSend.length > 0) {
      logger.info('mail sent, contents are:');
      logger.info(mailsToSend);
      logger.info('receivers are:');
      logger.info(subscribers);
    } else {
      logger.info('nothing to send');
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
