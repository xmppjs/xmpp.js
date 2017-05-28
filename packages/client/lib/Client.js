'use strict'

const ClientCore = require('@xmpp/client-core').Client
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
    const sasl = this.plugins.sasl
    sasl.handleMechanism = (mech, features) => new Promise((resolve, reject) => {
      this.emit('authenticate', (username, password) => {
        return sasl.authenticate(mech, {username, password}, features)
        .then(resolve)
        .catch((err) => {
          reject(err)
          throw err
        })
      })
    })
  }
}

module.exports = Client
