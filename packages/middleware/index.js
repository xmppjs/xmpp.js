'use strict'

const compose = require('koa-compose')

const IncomingContext = require('./lib/IncomingContext')
const OutgoingContext = require('./lib/OutgoingContext')

function listener(entity, middleware, Context) {
  return function(stanza) {
    if (!entity.jid) return
    const ctx = new Context(entity, stanza)
    return compose(middleware)(ctx)
  }
}

module.exports = function(entity) {
  const incoming = []
  const outgoing = []

  const incomingListener = listener(entity, incoming, IncomingContext)
  const outgoingListener = listener(entity, outgoing, OutgoingContext)

  entity.on('element', incomingListener)
  entity.hookOutgoing = outgoingListener

  return {
    incoming,
    outgoing,
    incomingListener,
    outgoingListener,
    use(fn) {
      incoming.push(fn)
      return fn
    },
    filter(fn) {
      outgoing.push(fn)
      return fn
    },
  }
}
