import * as fs from 'fs';
import * as path from 'path';
import type { ILogger } from './logging-service';
import type { IMailService, Mail } from './notification/mail-service';

export interface ICrashService {
  crash(reason: any): Promise<never>;
}

export class EmailCrashService implements ICrashService {
  private readonly logger: ILogger;
  private readonly mailService: IMailService;

  constructor(
    services: {
      logger: ILogger;
      mailService: IMailService;
    },
    private readonly adminEmailAdress: string,
  ) {
    this.logger = services.logger;
    this.mailService = services.mailService;
  }

  async crash(reason: string): Promise<never> {
    const logFilePath = path.join(this.logger.logFileDirname, this.logger.logFileName);
    const mail: Mail = {
      to: this.adminEmailAdress,
      subject: 'crash report for snowball-rss',
      text: reason,
    };
    if (fs.existsSync(logFilePath)) {
      mail.attachments = [
        {
          filename: 'log.txt',
          content: fs.readFileSync(logFilePath),
        },
      ];
    } else {
      this.logger.error('can not attach log file in crash report. It should be at ' + logFilePath);
    }
    await this.mailService.send(mail);
    this.logger.error(`app crashed, reports has been sent to ${this.adminEmailAdress}`);
    process.exit(1);
  }
}
