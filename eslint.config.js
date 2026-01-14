//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import reactHooks from 'eslint-plugin-react-hooks'
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default [
  {
    ignores: ['.output/**', 'dist/**', 'node_modules/**'],
  },
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
  reactYouMightNotNeedAnEffect.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'sort-imports': 'off',
      'import/order': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'react-hooks/refs': 'off',
    },
  },
]
