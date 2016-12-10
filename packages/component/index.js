'use strict'

const ComponentCore = require('@xmpp/component-core')
const reconnect = require('@xmpp/plugins/reconnect')

class Component extends ComponentCore {
  constructor () {
    super()
    super.plugin(reconnect)
  }
}

module.exports = Component
