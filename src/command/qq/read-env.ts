type EnvVars = {
  discordBotToken: string;
  discordChannelId: string;
};

export function readVarsFromEnvs(env = process.env): EnvVars {
  const discordBotToken = env.DISCORD_BOT_TOKEN;
  if (discordBotToken == null) {
    throw new Error('discordBotToken must be set via DISCORD_BOT_TOKEN environment variable');
  }

  const discordChannelId = env.DISCORD_CHANNEL_ID;
  if (discordChannelId == null) {
    throw new Error('discordChannelId must be set via DISCORD_CHANNEL_ID environment variable');
  }

  return {
    discordBotToken,
    discordChannelId,
  };
}
