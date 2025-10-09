import baseConfig from '../../configs/eslint/base.config.js';

export default [
  {
    ignores: [
      '**/.stryker-tmp/**/*',
      'dist/**/*',
      'node_modules/**/*'
    ],
  },
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    rules: {
      // Regex rules - Override base config
      'no-control-regex': 'off', // Allow control characters in regex (for ANSI escape codes)
      'no-invalid-regexp': 'off', // Allow potentially invalid regex patterns
      'no-useless-escape': 'off', // Allow unnecessary escape characters

      // Console rules - Allow console statements
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for flexibility
      'no-unused-vars': 'off', // Allow unused variables for now
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables for now
    },
  },
];