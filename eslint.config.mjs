import antfu from '@antfu/eslint-config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    ignores: [
      '**/*.md',
    ],
  },
  {
    // @see: https://github.com/schoero/eslint-plugin-better-tailwindcss?tab=readme-ov-file#rules
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs['recommended-warn'].rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': [
        'warn',
        {
          group: 'newLine',
          preferSingleLine: true,
          printWidth: 80,
        },
      ],
      'better-tailwindcss/no-unregistered-classes': [
        'warn',
        {
          detectComponentClasses: true,
          ignore: [
            'scrollbar-thin',
            'scrollbar-track-gray-100',
            'scrollbar-thumb-gray-300',
            'scrollbar-hidden',
            'custom-tag',
          ],
        },
      ],
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/renderer/src/assets/main.css',
      },
    },
  },
  {
    rules: {
      'vue/no-multiple-template-root': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/max-attributes-per-line': 'error',
      'vue/html-self-closing': ['error', {
        html: {
          void: 'never',
          normal: 'never',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      }],
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'unused-imports/no-unused-imports': 'warn',
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'node/prefer-global/process': 'off',
      'ts/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@stylistic/no-tabs': [
        'error',
        { allowIndentationTabs: true },
      ],
      'jsonc/indent': ['off'],
    },
  },
)
