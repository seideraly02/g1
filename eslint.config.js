import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.pdf-visual-audit/**',
      '.tmp-pdf-preview/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'qa-artifacts/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['eslint.config.js', 'tests/**/*.ts', 'vite.config.ts', 'netlify/functions/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        fetch: 'readonly',
        Headers: 'readonly',
      },
    },
  },
  prettier,
)
