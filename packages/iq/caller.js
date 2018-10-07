'use strict'

const xml = require('@xmpp/xml')
const xid = require('@xmpp/id')
const StanzaError = require('@xmpp/middleware/lib/StanzaError')
const {Deferred} = require('@xmpp/events')

function isReply({name, type}) {
  if (name !== 'iq') return false
  if (type !== 'error' && type !== 'result') return false
  return true
}

module.exports = function iqCaller({entity, middleware}) {
  const handlers = new Map()

  middleware.use(({type, name, id, stanza}, next) => {
    if (!isReply({name, type})) return next()

    const deferred = handlers.get(id)

    if (!deferred) {
      return next()
    }

    if (type === 'error') {
      deferred.reject(StanzaError.fromElement(stanza.getChild('error')))
    } else {
      deferred.resolve(stanza)
    }
    handlers.delete(id)
  })

  return {
    handlers,
    async get(child, ...args) {
      const response = await this.request(
        xml('iq', {type: 'get'}, child),
        ...args
      )
      return response.children[0]
    },
    async set(child, ...args) {
      const response = await this.request(
        xml('iq', {type: 'set'}, child),
        ...args
      )
      return response.children[0]
    },
    async request(stanza, params) {
      if (typeof params === 'string') {
        params = {to: params}
      }

      const {to, id} = params || {}
      if (to) {
        stanza.attrs.to = to
      }

      if (id) {
        stanza.attrs.id = id
      } else if (!stanza.attrs.id) {
        stanza.attrs.id = xid()
      }

      const deferred = new Deferred()
      handlers.set(stanza.attrs.id, deferred)

      try {
        await entity.send(stanza)
      } catch (err) {
        handlers.delete(stanza.attrs.id)
        throw err
      }

      return deferred.promise
    },
  }
}
