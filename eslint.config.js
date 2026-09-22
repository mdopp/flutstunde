// @ts-check

export default [
  {
    ignores: ['dist/', 'node_modules/'],
  },
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        requestAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        localStorage: 'readonly',
        URL: 'readonly',
        location: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  }
];
