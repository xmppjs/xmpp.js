'use strict'

const {plugin, xml} = require('@xmpp/plugin')
const streamfeatures = require('../stream-features')
const iqCaller = require('../iq-caller')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#bind
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-bind'

function makeBindElement(resource) {
  return xml('bind', {xmlns: NS}, resource && xml('resource', {}, resource))
}

function match(features) {
  return features.getChild('bind', NS)
}

module.exports = plugin(
  'bind',
  {
    start() {
      const streamFeature = {
        name: 'bind',
        priority: 2500,
        match,
        run: () => this.handleFeature(),
      }
      this.plugins['stream-features'].add(streamFeature)
    },
    bind(resource) {
      this.entity._status('binding')
      return this.plugins['iq-caller']
        .set(makeBindElement(resource))
        .then(result => {
          this.entity._jid(result.getChildText('jid'))
          this.entity._status('bound')
        })
    },
    handleFeature() {
      const {entity} = this
      entity._status('bind')
      return entity.isHandled('bind')
        ? entity.delegate('bind', resource => this.bind(resource))
        : this.bind()
    },
  },
  [streamfeatures, iqCaller]
)
