// ESLint (flat config): finds bad patterns in the code.
// Run with: npm run lint   /   npm run lint:fix
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  // Folders ESLint should never look at
  { ignores: ['node_modules/', 'reports/', 'test-results/', 'blob-report/', '.auth/'] },

  // Base recommended rules for JavaScript and TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Rules for all our source and test files
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // warn (not error) when using "any"
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // _arg is allowed unused
      // Playwright fixtures with no dependencies are written as `async ({}, use) =>`
      'no-empty-pattern': 'off',
    },
  },

  // Playwright-specific rules, only for test files
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error', // ban page.waitForTimeout() (hard waits = flaky tests)
      'playwright/no-page-pause': 'error', // ban leftover page.pause() debug calls
      'playwright/no-focused-test': 'error', // ban leftover test.only
      'playwright/no-conditional-in-test': 'off', // conditional cleanup registration is allowed
      // Tests must contain an assertion. Custom helpers listed here also count as assertions.
      'playwright/expect-expect': [
        'warn',
        {
          assertFunctionNames: [
            'expectError',
            'expectFieldError',
            'expectLoggedInAs',
            'expectEmployee',
            'expectUrlContains',
          ],
        },
      ],
    },
  },

  // Page objects and core code: no hard waits, warn on { force: true } clicks
  {
    files: ['src/core/**/*.ts', 'src/pages/**/*.ts'],
    plugins: { playwright },
    rules: { 'playwright/no-wait-for-timeout': 'error', 'playwright/no-force-option': 'warn' },
  },
);
