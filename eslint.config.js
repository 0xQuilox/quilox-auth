const js = require('@eslint/js');
module.exports = [
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: { console: 'readonly', process: 'readonly', require: 'readonly', module: 'readonly', __dirname: 'readonly', jest: 'readonly', describe: 'readonly', test: 'readonly', expect: 'readonly', beforeAll: 'readonly', afterAll: 'readonly', afterEach: 'readonly', beforeEach: 'readonly' } },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] }
  },
  { ignores: ['node_modules/**', 'coverage/**'] }
];
