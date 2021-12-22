import mailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Result } from './result';

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

export class MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(param: { service: string; user: string; pass: string }) {
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
          if (error) {
            return resolve(Result.err(error));
          }
          return resolve(Result.ok(info));
        },
      );
    });
  }
}
