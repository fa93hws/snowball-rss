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
  testEnvironment: 'jsdom',
};
