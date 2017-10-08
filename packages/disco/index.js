'use strict'

const middleware = require('./middleware')
const items = require('./items')
const info = require('./info')

const NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info'
const NS_DISCO_ITEMS = 'http://jabber.org/protocol/disco#items'

module.exports = ({router, caller, callee, features, identities}) => {
  if (!features) features = [NS_DISCO_INFO, NS_DISCO_ITEMS]
  if (!identities) identities = []

  return {
    features,
    identities,
    middleware: router.use(middleware(callee, features, identities)),
    items: (...args) => items(caller, ...args),
    info: (...args) => info(caller, ...args),
  }
}
