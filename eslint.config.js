import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const readOnly = 'readonly';

const appsScriptGlobals = {
  CardService: readOnly,
  GmailApp: readOnly,
  UrlFetchApp: readOnly,
  PropertiesService: readOnly,
  Utilities: readOnly,
  ScriptApp: readOnly,
  console: readOnly,
};

const testGlobals = {
  afterEach: readOnly,
  beforeEach: readOnly,
  describe: readOnly,
  expect: readOnly,
  it: readOnly,
  test: readOnly,
  vi: readOnly,
};

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: projectRoot,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: appsScriptGlobals,
    },
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: testGlobals,
    },
  },
  prettierConfig
);
