'use strict'

const xml = require('@xmpp/xml')

const NS_DISCO_ITEMS = 'http://jabber.org/protocol/disco#items'

module.exports = function items(caller, service, node) {
  return caller
    .get(xml('query', {xmlns: NS_DISCO_ITEMS, node}), service)
    .then(res => {
      return res.getChildren('item').map(i => i.attrs)
    })
}
