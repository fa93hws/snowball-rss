import { Result } from '@utils/result';
import { ILogger } from './logging-service';
import mailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface Mail {
  subject: string;
  text: string;
  to: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export interface IMailService {
  send(mail: Mail): Promise<Result.Result<any, Error>>;
}

export class MailService implements IMailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(
    param: { service: string; user: string; pass: string },
    private readonly logger: ILogger,
  ) {
    this.logger.debug('logging into email service');
    this.from = param.user;
    this.transporter = mailer.createTransport({
      service: param.service,
      auth: {
        user: param.user,
        pass: param.pass,
      },
    });
  }

  send(mail: Mail): Promise<Result.Result<any, Error>> {
    return new Promise((resolve) => {
      this.transporter.sendMail(
        {
          from: this.from,
          to: mail.to,
          subject: mail.subject,
          text: mail.text,
          attachments: mail.attachments,
        },
        (error, info) => {
          const mailWithoutAttachments = { ...mail };
          delete mailWithoutAttachments.attachments;
          if (error) {
            this.logger.error('failed to send mail, mail content:');
            this.logger.error(mailWithoutAttachments);
            this.logger.error('error from email service is:');
            this.logger.error(error);
            return resolve(Result.err(error));
          }
          this.logger.info('mail sent, contents are:');
          this.logger.info(mailWithoutAttachments);
          this.logger.info('receivers are:');
          this.logger.info(mailWithoutAttachments.to);
          return resolve(Result.ok(info));
        },
      );
    });
  }
}
