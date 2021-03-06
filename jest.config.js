const config = {
  coveragePathIgnorePatterns: [
    '/fake/.+',
    // screenshot service is covered by puppeteer test.
    'screenshot-service',
    '.tests.ts',
    'src/index.ts',
  ],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    // for rsshub
    '^@/(.*)$': '<rootDir>/node_modules/rsshub/lib/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.tsnode.json',
      isolatedModules: true,
    },
  },
  preset: 'ts-jest',
};

module.exports = {
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],

  projects: [
    {
      displayName: 'internal',
      testMatch: ['**/tests/**/*.tests.ts', '!**/*.puppeteer.tests.ts'],
      ...config,
    },
    {
      // external tests depends on external stuffs.
      displayName: 'external',
      testMatch: ['**/tests/*.puppeteer.tests.ts'],
      ...config,
    },
  ],
};
