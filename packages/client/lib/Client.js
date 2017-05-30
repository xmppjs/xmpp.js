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

    // So that we have a common inteface with component
    const {sasl} = this.plugins
    sasl.handleMechanism = (mech, features) => new Promise((resolve, reject) => {
      this._status('authenticate', (username, password) => {
        return sasl.authenticate(mech, {username, password}, features)
        .then(resolve)
        .catch(err => {
          reject(err)
          throw err
        })
      })
    })
  }
}

module.exports = Client
