type EnvVars = {
  botEmailService: string;
  botEmailAddress: string;
  botEmailPass: string;
  adminEmailAdress: string;
  subscribers: string[];
  snowballUserId: string;
};

export function readVarsFromEnvs(env = process.env): EnvVars {
  const botEmailService = env.MAILER_SERVICE;
  if (botEmailService == null) {
    throw new Error('email service must be set via MAILER_SERVICE environment variable');
  }

  const botEmailAddress = env.MAILER_USER;
  if (botEmailAddress == null) {
    throw new Error('email username must be set via MAILER_USER environment variable');
  }

  const botEmailPass = env.MAILER_PASS;
  if (botEmailPass == null) {
    throw new Error('email password must be set via MAILER_PASS environment variable');
  }

  const adminEmailAdress = env.ADMIN_EMAIL;
  if (adminEmailAdress == null) {
    throw new Error('admin email account must be set via ADMIN_EMAIL environment variable');
  }

  const rawSubscribers = env.SUBSCRIBERS;
  if (rawSubscribers == null) {
    throw new Error('subscriber must be set via SUBSCRIBERS environment variable');
  }
  const subscribers = rawSubscribers.split(', ');

  const snowballUserId = env.SNOWBALL_USER_ID;
  if (snowballUserId == null) {
    throw new Error('user ID must be set via SNOWBALL_USER_ID environment variable');
  }

  return {
    botEmailService,
    botEmailAddress,
    botEmailPass,
    adminEmailAdress,
    subscribers,
    snowballUserId,
  };
}
