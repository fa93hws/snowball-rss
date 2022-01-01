type EnvVars = {
  qmsgToken: string;
};

export function readVarsFromEnvs(env = process.env): EnvVars {
  const qmsgToken = env.QMSG_TOKEN;
  if (qmsgToken == null) {
    throw new Error('qmsgToken must be set via QMSG_TOKEN environment variable');
  }

  return {
    qmsgToken,
  };
}
