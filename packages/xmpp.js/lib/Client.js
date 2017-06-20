'use strict'

const ClientCore = require('@xmpp/client-core').Client
const plugins = require('./plugins')

class Client extends ClientCore {
  constructor(...args) {
    super(...args)
    Object.keys(plugins).forEach(name => {
      const plugin = plugins[name]
      // Ignore browserify stubs
      if (!plugin.plugin) {
        return
      }
      this.plugin(plugin)
    })
  }
}

module.exports = Client
