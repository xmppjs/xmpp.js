'use strict'

const ClientCore = require('@xmpp/client-core').Client
const plugins = require('./plugins')

class Client extends ClientCore {
  constructor(...args) {
    super(...args)
    Object.keys(plugins).forEach(name => {
      const plugin = plugins[name]
      if (!plugin.plugin) {
        return
      } // Browserify stub
      this.plugin(plugin)
    })
  }
}

module.exports = Client
