const path = require('path');
require('dotenv').config();

require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json'),
  transpileOnly: true,
});
require('./src/index.ts').main();
