// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', 'node_modules.bak/*'],
    rules: {
      'import/namespace': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
