module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: [
    '@typescript-eslint',
    'babel',
    'jest',
    'react-hooks',
    'jsx-a11y',
    'jest',
  ],
  env: {
    node: true,
    browser: true,
  },
  extends: [
    'eslint-config-prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react/recommended',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    '@typescript-eslint/no-shadow': ['error'],

    'no-console': 'error',

    'jest/no-test-callback': 'off',

    'react/display-name': 'off',
  },
  overrides: [
    {
      files: ['tools/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
