import baseConfig from './configs/eslint/base.config.js';
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/dist/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      'build/**/*',
      '*.d.ts',
      'temp/**/*',
      '.stryker-tmp/**/*',
      '**/.stryker-tmp/**/*',
      'packages/core/test-tools/**/*',
      'packages/*/dist/**/*'
    ],
  },
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        require: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        exports: 'readonly',

        // Browser/Performance globals
        console: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',

        // Test globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        jest: 'readonly',

        // Additional Node.js/Browser globals
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        NodeJS: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript specific rules - Override base config
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with TypeScript
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables for now
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for flexibility
      'no-console': 'off', // Allow console in test/utility files
      'no-control-regex': 'off', // Allow control characters in regex (for ANSI escape codes)
      'no-invalid-regexp': 'off', // Allow potentially invalid regex patterns
      'no-useless-escape': 'off', // Allow unnecessary escape characters
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        require: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        exports: 'readonly',

        // Browser/Performance globals
        console: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',

        // Test globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        jest: 'readonly',

        // Additional Node.js/Browser globals
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        NodeJS: 'readonly',
      }
    },
    rules: {
      'no-unused-vars': 'off', // Allow unused variables for now - Override base config
      'no-console': 'off', // Allow console in utility files
      'no-control-regex': 'off', // Allow control characters in regex (for ANSI escape codes)
      'no-invalid-regexp': 'off', // Allow potentially invalid regex patterns
      'no-useless-escape': 'off', // Allow unnecessary escape characters
    },
  },
];