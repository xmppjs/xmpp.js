'use strict'

const xml = require('@xmpp/xml')

const {NS_DISCO_INFO, NS_DISCO_ITEMS} = require('.')

class ServiceDiscoveryCaller {
  constructor({iqCaller}) {
    this.iqCaller = iqCaller
  }

  async items(service, node) {
    return (await this.iqCaller.get(
      xml('query', {xmlns: NS_DISCO_ITEMS, node}),
      service
    ))
      .getChildren('item')
      .map(i => i.attrs)
  }

  // https://xmpp.org/extensions/xep-0030.html#info
  async info(service, node) {
    const res = await this.iqCaller.get(
      xml('query', {xmlns: NS_DISCO_INFO, node}),
      service
    )

    return {
      features: res.getChildren('feature').map(f => f.attrs.var),
      identities: res.getChildren('identity').map(i => i.attrs),
    }
  }
}

module.exports = function(...args) {
  return new ServiceDiscoveryCaller(...args)
}
