module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.ts', '.js'],
    warnOnUnsupportedTypeScriptVersion: true,
    createDefaultProgram: false,
  },
  plugins: ['simple-import-sort', 'tsdoc', 'jest'],
  env: {
    'jest/globals': true,
  },
  extends: ['xo-space'],
  rules: {
    'capitalized-comments': [
      'error',
      'always',
      {
        ignorePattern: '^eslint-disable',
        ignoreInlineComments: true,
      },
    ],
    'sort-imports': 'off',
    'import/order': 'off',
    'simple-import-sort/sort': [
      'error',
      {
        groups: [['^\\u0000', '^@?\\w', '^[^.]', '^\\.']],
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'prettier/@typescript-eslint',
      ],
      rules: {
        "no-useless-constructor": "off",
        "@typescript-eslint/no-useless-constructor": "error",
        'tsdoc/syntax': 'error',
      },
    },
    {
      files: ['*.test.ts', '__mocks__/**/*.ts'],
      extends: ['plugin:jest/recommended', 'plugin:jest/style'],
    },
  ],
};
