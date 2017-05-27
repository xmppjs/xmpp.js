'use strict'

const resolve = require('./index')
// for you
// const resolve = require('@xmpp/resolve')

resolve('jabberfr.org').then(console.log).catch(console.error)
