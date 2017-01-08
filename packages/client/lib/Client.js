'use strict'

const ClientCore = require('@xmpp/client-core')
const plugins = require('./plugins')

class Client extends ClientCore {
  constructor () {
    super()
    // TODO move to client-connection ?
    Object.keys(plugins).forEach(name => {
      const plugin = plugins[name]
      this.plugin(plugin)
    })
  }

  // // TODO move to a plugin ?
  // connect (options) {
  //   // let params = {}
  //   // if (typeof options === 'string') {
  //   //   params.uri = options
  //   // } else {
  //   //   Object.assign(params, options)
  //   // }

  //   // TODO promise, SRV
  //   // this.getAltnernativeConnectionsMethods('localhost', (err, methods) => {
  //     // console.log(err || methods)
  //   return super.connect(params.uri)
  //     .then(() => this.open(params.domain))
  //     // .then(() => authenticate(this, params))
  //     // .then(() => bind(this, params.resource))
  // }
}

module.exports = Client
