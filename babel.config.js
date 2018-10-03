'use strict'

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          ie: '10',
        },
        loose: true,
      },
    ],
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    'babel-plugin-transform-async-to-promises',
    '@babel/plugin-proposal-object-rest-spread',
  ],
}
