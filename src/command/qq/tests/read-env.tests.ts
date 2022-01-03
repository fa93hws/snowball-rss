import { readVarsFromEnvs } from '../read-env';

describe('readVarsFromEnvs', () => {
  const fakeEnv = {
    DISCORD_BOT_TOKEN: 'discordBotToken',
    DISCORD_CHANNEL_ID: 'discordChannelId',
  };

  it('parse env to object', () => {
    const envVars = readVarsFromEnvs(fakeEnv);
    expect(envVars).toEqual({
      discordBotToken: 'discordBotToken',
      discordChannelId: 'discordChannelId',
    });
  });

  it.each(Object.keys(fakeEnv))('throw error if env var %s is not set', (key) => {
    const env = { ...fakeEnv, [key]: undefined };
    expect(() => readVarsFromEnvs(env)).toThrowError(key);
  });
});
