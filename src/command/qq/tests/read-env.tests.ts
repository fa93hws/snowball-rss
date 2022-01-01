import { readVarsFromEnvs } from '../read-env';

describe('readVarsFromEnvs', () => {
  const fakeEnv = {
    QMSG_TOKEN: 'qmsg token',
  };

  it('parse env to object', () => {
    const envVars = readVarsFromEnvs(fakeEnv);
    expect(envVars).toEqual({
      qmsgToken: 'qmsg token',
    });
  });

  it.each(Object.keys(fakeEnv))('throw error if env var %s is not set', (key) => {
    const env = { ...fakeEnv, [key]: undefined };
    expect(() => readVarsFromEnvs(env)).toThrowError(key);
  });
});
