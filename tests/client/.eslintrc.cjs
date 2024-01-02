/* eslint-env node */

module.exports = {
  extends: [
    '../../client/.eslintrc.cjs',
  ],
  parserOptions: {
    project: '../../tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  root: true,
};
