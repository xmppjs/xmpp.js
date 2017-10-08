'use strict'

const xml = require('@xmpp/xml')

const NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info'

module.exports = function info(caller, service, node) {
  return caller
    .get(xml('query', {xmlns: NS_DISCO_INFO, node}), service)
    .then(res => {
      return [
        res.getChildren('feature').map(f => f.attrs.var),
        res.getChildren('identity').map(i => i.attrs),
      ]
    })
}
