import { readVarsFromEnvs } from '../read-envs';

describe('readVarsFromEnvs', () => {
  const fakeEnv = {
    MAILER_SERVICE: 'mailer service',
    MAILER_USER: 'mailer user',
    MAILER_PASS: 'mailer pass',
    ADMIN_EMAIL: 'admin email',
    SUBSCRIBERS: 'subscriber1, subscriber2',
    SNOWBALL_USER_ID: 'snowball user id',
  };

  it('parse env to object', () => {
    const envVars = readVarsFromEnvs(fakeEnv);
    expect(envVars).toEqual({
      botEmailService: 'mailer service',
      botEmailAddress: 'mailer user',
      botEmailPass: 'mailer pass',
      adminEmailAdress: 'admin email',
      subscribers: ['subscriber1', 'subscriber2'],
      snowballUserId: 'snowball user id',
    });
  });

  it.each(Object.keys(fakeEnv))('throw error if env var %s is not set', (key) => {
    const env = { ...fakeEnv, [key]: undefined };
    expect(() => readVarsFromEnvs(env)).toThrowError(key);
  });
});
