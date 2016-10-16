'use strict'

const XMPP = require('./XMPP')
const HTTP = require('./HTTP')
const cache = require('./cache')

cache.start().then(() => {
  return Promise.all([
    XMPP.start(),
    HTTP.start()
  ])
}).catch(err => {
  console.error(err)
  process.exit(1)
})

process.on('unhandledRejection', function (reason, p) {
  console.error('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
