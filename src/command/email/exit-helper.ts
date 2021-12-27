import type { IExitHelper } from '@services/exit-helper';
import type { ILogger } from '@services/logging-service';
import type { IMailService, Mail } from '@services/notification/mail-service';
import path from 'path';
import fs from 'fs';

export class ExitHelper implements IExitHelper {
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

  async onUnexpectedExit(reason: string): Promise<never> {
    const logFilePath = path.join(this.logger.logFileDirname, this.logger.logFileName);
    const mail: Mail = {
      to: this.adminEmailAdress,
      subject: 'crash report for snowball-rss',
      text: reason,
    };
    if (fs.existsSync(logFilePath)) {
      mail.attachments = [
        {
          filename: 'error.log',
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

  async onExpectedExit(e: any): Promise<never> {
    const mail: Mail = {
      to: this.adminEmailAdress,
      subject: 'service down',
      text: e,
    };
    await this.mailService.send(mail);
    this.logger.error(
      `app stops in an expeted way, mail has been sent to ${this.adminEmailAdress}`,
    );
    process.exit(1);
  }
}
