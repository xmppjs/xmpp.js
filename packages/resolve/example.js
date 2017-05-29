'use strict'

const resolve = require('./index')
// For you
// const resolve = require('@xmpp/resolve')

resolve('jabberfr.org').then(console.log).catch(console.error) // eslint-disable-line no-console
