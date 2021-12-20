if (process.env.MAILER_PASS == null) {
  throw new Error(
    'email password must be set via MAIL_PASS environment variable',
  );
}
if (process.env.MAILER_USER == null) {
  throw new Error(
    'email username must be set via MAILER_USER environment variable',
  );
}
if (process.env.MAILER_SERVICE == null) {
  throw new Error(
    'email service must be set via MAILER_SERVICE environment variable',
  );
}
if (process.env.ADMIN_EMAIL == null) {
  throw new Error(
    'admin email account must be set via ADMIN_EMAIL environment variable',
  );
}
if (process.env.SUBSCRIBER == null) {
  throw new Error('subscriber must be set via SUBSCRIBER environment variable');
}

export const config = {
  xueqiu: {
    url: 'https://rsshub.app/xueqiu/user/6784593966',
  },
  mailer: {
    service: process.env.MAILER_SERVICE,
    sender: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS,
    },
    subscriber: process.env.SUBSCRIBER.split(', '),
    // may send testing email and crash email to this account
    adminEmail: process.env.ADMIN_EMAIL,
  },
};
