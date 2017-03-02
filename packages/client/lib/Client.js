'use strict'

const ClientCore = require('@xmpp/client-core')
const plugins = require('./plugins')

class Client extends ClientCore {
  constructor () {
    super()
    Object.keys(plugins).forEach(name => {
      const plugin = plugins[name]
      if (!plugin.plugin) return // browserify stub
      this.plugin(plugin)
    })

    // so that we have a common inteface with component
    this.plugins.sasl.getCredentials = () => {
      return new Promise((resolve) => {
        this.emit('authenticate', (username, password) => {
          resolve([username, password])
        })
      })
    }
  }
}

module.exports = Client
