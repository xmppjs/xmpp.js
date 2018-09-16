'use strict'

const xml = require('@xmpp/xml')

const NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info'
const NS_DISCO_ITEMS = 'http://jabber.org/protocol/disco#items'

module.exports = function({iqCaller}) {
  return {
    items(service, node) {
      return iqCaller
        .get(xml('query', {xmlns: NS_DISCO_ITEMS, node}), service)
        .then(res => {
          return res.getChildren('item').map(i => i.attrs)
        })
    },
    info(service, node) {
      return iqCaller
        .get(xml('query', {xmlns: NS_DISCO_INFO, node}), service)
        .then(res => {
          return [
            res.getChildren('feature').map(f => f.attrs.var),
            res.getChildren('identity').map(i => i.attrs),
          ]
        })
    },
  }
}
