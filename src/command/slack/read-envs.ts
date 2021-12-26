type EnvVars = {
  botUserToken: string;
  userToken: string;
};

export function readVarsFromEnvs(env = process.env): EnvVars {
  const botUserToken = env.SLACK_BOT_USER_TOKEN;
  if (botUserToken == null) {
    throw new Error('botUserToken must be set via SLACK_BOT_USER_TOKEN environment variable');
  }

  const userToken = env.SLACK_USER_TOKEN;
  if (userToken == null) {
    throw new Error('userToken must be set via SLACK_USER_TOKEN environment variable');
  }

  return {
    botUserToken,
    userToken,
  };
}
