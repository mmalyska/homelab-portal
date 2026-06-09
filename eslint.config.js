const { fixupConfigRules } = require('@eslint/compat');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = [
  { ignores: ['.expo/**', 'assets/**'] },
  ...fixupConfigRules(expoConfig),
  prettierConfig,
];
