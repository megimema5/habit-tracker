// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },

  // Base rules for every file
  js.configs.recommended,

  // TypeScript rules that use type information (catch real bugs, e.g. un-awaited promises)
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },

  // Server + shared: Node globals, explicit return types on exported functions
  {
    files: ['server/**/*.ts', 'shared/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
  {
    // Tests and config files don't need explicit return types
    files: ['**/*.test.ts', '**/*.config.ts'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' },
  },

  // Client: React, hooks rules, browser globals, no dangerouslySetInnerHTML
  {
    files: ['client/**/*.{ts,tsx}'],
    plugins: { react },
    settings: { react: { version: 'detect' } },
    languageOptions: { globals: globals.browser },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      'react/no-danger': 'error',
      'react/prop-types': 'off',
    },
  },
  { files: ['client/**/*.{ts,tsx}'], ...reactHooks.configs.flat['recommended-latest'] },
  { files: ['client/**/*.{ts,tsx}'], ...reactRefresh.configs.vite },

  // Plain JS files (like this one) are not type-checked
  { files: ['**/*.js'], ...tseslint.configs.disableTypeChecked },

  // Must be last: turns off rules that would fight with Prettier
  prettier,
);
