import baseConfig from './configs/eslint/base.config.js';

export default [
  ...baseConfig,
  {
    ignores: [
      '**/dist/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      'build/**/*',
      '*.d.ts',
      'temp/**/*',
      'packages/core/test-tools/**/*',
      'packages/*/dist/**/*',
      'apps/cli/src/**/*.tsx'
    ],
  }
];