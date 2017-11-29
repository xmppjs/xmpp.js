'use strict'

const ping = require('./ping')
const middleware = require('./middleware')

const NS_PING = 'urn:xmpp:ping'

module.exports = ({router, caller, callee}) => {
  return {
    middleware: router.use(middleware(callee)),
    ping: (...args) => ping(caller, ...args),
    features: [NS_PING],
  }
}
