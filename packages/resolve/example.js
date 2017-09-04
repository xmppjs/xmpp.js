'use strict'

const resolve = require('./index')
// For you
// const resolve = require('@xmpp/resolve')

resolve('jabberfr.org')
  .then(console.log) // eslint-disable-line no-console
  .catch(console.error) // eslint-disable-line no-console
