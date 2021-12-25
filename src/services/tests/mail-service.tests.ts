import { MailService } from '../notification/mail-service';
import mailer from 'nodemailer';
import { fakeLogger } from '@services/fake/logging-service';

describe('mailService', () => {
  const params = {
    service: 'gmail',
    user: 'user',
    pass: 'pass',
  };
  const mail = {
    subject: 'subject',
    text: 'text',
    to: 'to',
  };

  it('create transport during construction', () => {
    const mockTransportCreator = jest.fn();
    jest.spyOn(mailer, 'createTransport').mockImplementationOnce(mockTransportCreator);
    new MailService(params, fakeLogger);
    expect(mockTransportCreator).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'user',
        pass: 'pass',
      },
    });
  });

  it('returns info after email is sent', async () => {
    const fakeSendMail = jest.fn().mockImplementationOnce((_, cb) => cb(null, 'info'));
    const fakeTransport = {
      sendMail: fakeSendMail,
    };
    const mockTransportCreator = jest.fn().mockReturnValueOnce(fakeTransport);
    jest.spyOn(mailer, 'createTransport').mockImplementationOnce(mockTransportCreator);
    const mailService = new MailService(params, fakeLogger);
    const result = await mailService.send(mail);
    expect(result).toEqual({
      isOk: true,
      value: 'info',
    });
    expect(fakeSendMail).toHaveBeenCalledWith(
      { ...mail, from: 'user', attachments: undefined },
      expect.any(Function),
    );
  });

  it('returns error if email is failed to send', async () => {
    const fakeSendMail = jest.fn().mockImplementationOnce((_, cb) => cb(new Error('err'), null));
    const fakeTransport = {
      sendMail: fakeSendMail,
    };
    const mockTransportCreator = jest.fn().mockReturnValueOnce(fakeTransport);
    jest.spyOn(mailer, 'createTransport').mockImplementationOnce(mockTransportCreator);
    const mailService = new MailService(params, fakeLogger);
    const result = await mailService.send(mail);
    expect(result).toEqual({
      isOk: false,
      error: new Error('err'),
    });
    expect(fakeSendMail).toHaveBeenCalledWith(
      { ...mail, from: 'user', attachments: undefined },
      expect.any(Function),
    );
  });
});
