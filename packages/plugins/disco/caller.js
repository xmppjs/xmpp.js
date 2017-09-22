'use strict'

const iq = require('../iq-caller')
const {plugin, xml} = require('@xmpp/plugin')

const NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info'
const NS_DISCO_ITEMS = 'http://jabber.org/protocol/disco#items'

module.exports = plugin(
  'disco-caller',
  {
    items(service, node) {
      return this.entity.plugins['iq-caller']
        .get(xml('query', {xmlns: NS_DISCO_ITEMS, node}), service)
        .then(res => {
          return res.getChildren('item').map(i => i.attrs)
        })
    },
    info(service, node) {
      return this.entity.plugins['iq-caller']
        .get(xml('query', {xmlns: NS_DISCO_INFO, node}), service)
        .then(res => {
          return [
            res.getChildren('feature').map(f => f.attrs.var),
            res.getChildren('identity').map(i => i.attrs),
          ]
        })
    },
  },
  [iq]
)
