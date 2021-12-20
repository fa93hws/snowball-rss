module.exports = {
  testMatch: ['**/tests/**/*.tests.ts{,x}'],
  collectCoverageFrom: [
    'src/**/*.ts{,x}',
    'tools/**/*.ts',
    'config/**/*.ts',
    '!**/fixtures/**',
    '!**/stories/**',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/config/jest/setup.ts'],
  moduleNameMapper: {
    '@styles/(.*)$': '<rootDir>/src/styles/$1',
    '@ui/(.*)$': '<rootDir>/src/ui/$1',
    '@pages/(.*)$': '<rootDir>/src/pages/$1',
    '@services/(.*)$': '<rootDir>/src/services/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.tsnode.json',
      isolatedModules: true,
    },
  },
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
};
