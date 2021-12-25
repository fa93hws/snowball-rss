import { readVarsFromEnvs } from '../read-envs';

describe('readVarsFromEnvs', () => {
  const fakeEnv = {
    SLACK_BOT_USER_TOKEN: 'xoxb-xxxx-yyyy-xyxyxy',
    SLACK_USER_TOKEN: 'xoxp-xxxx-yyyy-xyxyxy',
  };

  it('parse env to object', () => {
    const envVars = readVarsFromEnvs(fakeEnv);
    expect(envVars).toEqual({
      BotUserToken: 'xoxb-xxxx-yyyy-xyxyxy',
      UserToken: 'xoxp-xxxx-yyyy-xyxyxy',
    });
  });

  it.each(Object.keys(fakeEnv))('throw error if env var %s is not set', (key) => {
    const env = { ...fakeEnv, [key]: undefined };
    expect(() => readVarsFromEnvs(env)).toThrowError(key);
  });
});
