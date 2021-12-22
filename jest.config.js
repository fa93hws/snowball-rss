const config = {
  moduleNameMapper: {
    '@services/(.*)$': '<rootDir>/src/services/$1',
    '@utils/(.*)$': '<rootDir>/src/utils/$1',
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
  coveragePathIgnorePatterns: ['/fake/.+'],
  coverageDirectory: 'coverage',

  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/tests/**/*.tests.ts', '!**/*.puppeteer.tests.ts'],
      ...config,
    },
    {
      displayName: 'puppeteer',
      testMatch: ['**/tests/*.puppeteer.tests.ts'],
      ...config,
    },
  ],
};
