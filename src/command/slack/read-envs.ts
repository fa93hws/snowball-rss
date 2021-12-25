type EnvVars = {
  BotUserToken: string;
  UserToken: string;
};

export function readVarsFromEnvs(env = process.env): EnvVars {
  const BotUserToken = env.SLACK_BOT_USER_TOKEN;
  if (BotUserToken == null) {
    throw new Error('BotUserToken must be set via SLACK_BOT_USER_TOKEN environment variable');
  }

  const UserToken = env.SLACK_USER_TOKEN;
  if (UserToken == null) {
    throw new Error('UserToken must be set via SLACK_USER_TOKEN environment variable');
  }

  return {
    BotUserToken,
    UserToken,
  };
}
