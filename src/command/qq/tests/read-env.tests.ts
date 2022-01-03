import { readVarsFromEnvs } from '../read-env';

describe('readVarsFromEnvs', () => {
  const fakeEnv = {
    DISCORD_BOT_TOKEN: 'discordBotToken',
    DISCORD_CHANNEL_ID: 'discordChannelId',
    QQ_BOT_ACCOUNT: '123',
    QQ_ADMIN_ACCOUNT: '456',
    QQ_GROUP_ID: '789',
    SNOWBALL_USER_ID: 'snowballUserId',
  };

  it('parse env to object', () => {
    const envVars = readVarsFromEnvs(fakeEnv);
    expect(envVars).toEqual({
      discordBotToken: 'discordBotToken',
      discordChannelId: 'discordChannelId',
      qqBotAccount: 123,
      qqAdminAccount: 456,
      qqGroupId: 789,
      snowballUserId: 'snowballUserId',
      qqBotPassword: undefined,
    });
  });

  it.each(Object.keys(fakeEnv))('throw error if env var %s is not set', (key) => {
    const env = { ...fakeEnv, [key]: undefined };
    expect(() => readVarsFromEnvs(env)).toThrowError(key);
  });

  it.each(['QQ_BOT_ACCOUNT', 'QQ_ADMIN_ACCOUNT', 'QQ_GROUP_ID'])(
    'throws if env var %s is not an integer',
    (key) => {
      const env = { ...fakeEnv, [key]: 123.456 };
      expect(() => readVarsFromEnvs(env)).toThrowError(key);
    },
  );
});
