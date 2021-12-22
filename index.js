const path = require('path');
const tsconfigPaths = require('tsconfig-paths');

require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json'),
  transpileOnly: true,
});

const config = tsconfigPaths.loadConfig();
tsconfigPaths.register(config);

require('./src/index.ts');
