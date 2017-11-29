'use strict'

const ClientCore = require('@xmpp/client-core').Client
const plugins = require('./plugins')
const middleware = require('@xmpp/middleware')

class Client extends ClientCore {
  constructor(...args) {
    super(...args)
    Object.assign(this, middleware(this))
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
