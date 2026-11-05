import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const reactHooksRules =
  reactHooks.configs.flat?.recommended?.rules ??
  reactHooks.configs.recommended.rules;

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooksRules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: [
      'src/core/**/*.{ts,tsx}',
      'src/modules/*/application/**/*.{ts,tsx}',
      'src/modules/*/domain/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react-router-dom',
                'react/jsx-runtime',
                'dexie',
                'pdf-lib',
                'zod',
              ],
              message:
                'La lógica de negocio no debe depender de React, UI ni librerías de infraestructura.',
            },
            {
              group: [
                '**/infrastructure/**',
                '**/ui/**',
                '**/shared/browser/**',
              ],
              message:
                'El dominio y la aplicación solo pueden depender de puertos, no de adaptadores concretos.',
            },
          ],
        },
      ],
    },
  },
);
