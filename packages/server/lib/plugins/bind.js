'use strict'

const { Element } = require('ltx')
const plugin = require('@xmpp/plugin')
const streamFeatures = require('./stream-features')

const NS_BIND = 'urn:ietf:params:xml:ns:xmpp-bind'

class BindError extends Error {
  constructor(type, condition) {
    super()
    this.name = 'BindError'
    this.type = type
    this.condition = condition
  }
}

function handler(ctx) {
  const { stanza, entity, id } = ctx
  const { authenticated, jid } = entity

  if (authenticated && jid && jid.getLocal() && !jid.getResource()) {
    const bind = stanza.getChild('bind', NS_BIND)
    const resourceNode = bind.getChild('resource', NS_BIND)
    const resource = resourceNode ? resourceNode.getText() : null

    const sendBind = (resource) => {
      if (!resource) {
        resource = entity.generateId()
      }
      jid.setResource(resource)

      entity.send(
        new Element('iq', {
          type: 'result',
          id,
        })
          .c('bind', { xmlns: NS_BIND })
          .c('jid').t(jid.toString())
          .root()
      )
      entity.emit('online')
    }

    if (entity.isHandled('bind')) {
      entity.delegate('bind', resource => sendBind(resource))
    } else {
      sendBind(resource)
    }
  } else {
    throw new BindError('cancel', 'not-allowed')
  }
}

module.exports = plugin(
  'bind',
  {
    streamFeature: {
      name: 'bind',
      xmlns: NS_BIND,
      match: (entity) => entity.authenticated,
    },

    start() {
      this.plugins['stream-features'].add(this.streamFeature)
      this.entity.router.use(`iq-set/${NS_BIND}/bind`, handler)
    },

    stop() {
      this.plugins['stream-features'].remove(this.streamFeature)
    },

  },
  [streamFeatures]
)
