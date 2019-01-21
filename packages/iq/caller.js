'use strict'

const xid = require('@xmpp/id')
const StanzaError = require('@xmpp/middleware/lib/StanzaError')
const {Deferred} = require('@xmpp/events')
const timeoutPromise = require('@xmpp/events').timeout

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
    async request(stanza, timeout = 30 * 1000) {
      if (!stanza.attrs.id) {
        stanza.attrs.id = xid()
      }

      const deferred = new Deferred()
      handlers.set(stanza.attrs.id, deferred)

      try {
        await entity.send(stanza)
        await timeoutPromise(deferred.promise, timeout)
      } catch (err) {
        handlers.delete(stanza.attrs.id)
        throw err
      }

      return deferred.promise
    },
  }
}
