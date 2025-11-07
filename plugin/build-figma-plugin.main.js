const path = require('path');

module.exports = function (buildOptions) {
  return {
    ...buildOptions,
    define: {
      global: 'globalThis',
      'process.env': '{}'
    },
    platform: 'browser',
    mainFields: ['browser', 'module', 'main'],
    resolveExtensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx'],
    alias: {
      'xmlhttprequest-ssl': path.resolve(__dirname, 'src/xmlhttprequest-stub.js')
    }
  }
}

