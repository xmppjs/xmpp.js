import _Client from '@xmpp/client-core'
import plugins from './plugins'

import {addAuthenticator} from '@xmpp/client-authentication'
import sasl from '@xmpp/client-sasl'
import legacy_authentication from '@xmpp/client-legacy-authentication'

// import {bindStreamFeature} from '@xmpp/client-bind'
// import {SASLStreamFeature} from '@xmpp/client-sasl'
// import {legacyAuthenticationStreamFeature} from '@xmpp/client-legacy-authentication'

class Client extends _Client {
  constructor () {
    super()
    // TODO move to client-connection ?
      Object.keys(plugins).forEach(name => {
        const plugin = plugins[name]
      // plugin = require('@xmpp/client-' + plugin)
      // // ignored by bundler
      // if (typeof plugin !== 'function' || Object.keys(plugin) === 0) return
      if (typeof plugin === 'function') this.use(plugin)
      else if (plugin && typeof plugin.plugin === 'function') this.use(plugin.plugin)
    })

    addAuthenticator(this, sasl)
    addAuthenticator(this, legacy_authentication)
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

export default Client
