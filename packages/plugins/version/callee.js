'use strict'

const iq = require('../iq-callee')
const disco = require('../disco/callee')
const {plugin, xml} = require('@xmpp/plugin')

const NS_VERSION = 'jabber:iq:version'

module.exports = plugin(
  'version-callee',
  {
    name: '',
    version: '',
    os: '',
    start() {
      this.plugins['disco-callee'].features.add(NS_VERSION)
      this.plugins['iq-callee'].get(NS_VERSION, () => {
        return xml(
          'query',
          {xmlns: NS_VERSION},
          ['name', 'version', 'os'].map(v => xml(v, {}, this[v]))
        )
      })
    },
  },
  [iq, disco]
)
