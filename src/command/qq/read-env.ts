type EnvVars = {
  discordBotToken: string;
  discordChannelId: string;
  qqBotAccount: number;
  qqAdminAccount: number;
  qqGroupId: number;
  snowballUserId: string;

  qqBotPassword: string | undefined;
};

function parseString(envName: string, env = process.env): string {
  const value = env[envName];
  if (!value) {
    throw new Error(`env.${envName} is required`);
  }
  return value;
}

function parseNumber(envName: string, env = process.env): number {
  const value = parseString(envName, env);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed.toString() !== value) {
    throw new Error(`env.${envName} is not an integer`);
  }
  return parsed;
}

export function readVarsFromEnvs(env = process.env): EnvVars {
  return {
    discordBotToken: parseString('DISCORD_BOT_TOKEN', env),
    discordChannelId: parseString('DISCORD_CHANNEL_ID', env),
    qqBotAccount: parseNumber('QQ_BOT_ACCOUNT', env),
    qqAdminAccount: parseNumber('QQ_ADMIN_ACCOUNT', env),
    qqGroupId: parseNumber('QQ_GROUP_ID', env),
    snowballUserId: parseString('SNOWBALL_USER_ID', env),
    qqBotPassword: env.QQ_BOT_PASSWORD,
  };
}
