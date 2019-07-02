'use strict'

/**
 * References
 * https://xmpp.org/rfcs/rfc6120.html#stanzas-semantics-iq
 * https://xmpp.org/rfcs/rfc6120.html#stanzas-error
 */

const xml = require('@xmpp/xml')

const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

function isQuery({name, type}) {
  if (name !== 'iq') return false
  if (type === 'error' || type === 'result') return false
  return true
}

function isValidQuery({type}, children, child) {
  if (type !== 'get' && type !== 'set') return false
  if (children.length !== 1) return false
  if (!child) return false
  return true
}

function buildReply({stanza}) {
  return xml('iq', {
    to: stanza.attrs.from,
    from: stanza.attrs.to,
    id: stanza.attrs.id,
  })
}

function buildReplyResult(ctx, child) {
  const reply = buildReply(ctx)
  reply.attrs.type = 'result'
  if (child) {
    reply.append(child)
  }

  return reply
}

function buildReplyError(ctx, error, child) {
  const reply = buildReply(ctx)
  reply.attrs.type = 'error'
  if (child) {
    reply.append(child)
  }

  reply.append(error)
  return reply
}

function buildError(type, condition) {
  return xml('error', {type}, xml(condition, NS_STANZA))
}

function iqHandler(entity) {
  return async function iqHandler(ctx, next) {
    if (!isQuery(ctx)) return next()

    const {stanza} = ctx
    const children = stanza.getChildElements()
    const [child] = children

    if (!isValidQuery(ctx, children, child)) {
      return buildReplyError(ctx, buildError('modify', 'bad-request'), child)
    }

    ctx.element = child

    let reply
    try {
      reply = await next()
    } catch (err) {
      entity.emit('error', err)
      reply = buildError('cancel', 'internal-server-error')
    }

    if (!reply) {
      reply = buildError('cancel', 'service-unavailable')
    }

    if (reply instanceof xml.Element && reply.is('error')) {
      return buildReplyError(ctx, reply, child)
    }

    return buildReplyResult(
      ctx,
      reply instanceof xml.Element ? reply : undefined
    )
  }
}

function route(type, ns, name, handler) {
  return function(ctx, next) {
    if ((ctx.type !== type) | !ctx.element || !ctx.element.is(name, ns))
      return next()
    return handler(ctx, next)
  }
}

module.exports = function({middleware, entity}) {
  middleware.use(iqHandler(entity))

  return {
    get(ns, name, handler) {
      middleware.use(route('get', ns, name, handler))
    },
    set(ns, name, handler) {
      middleware.use(route('set', ns, name, handler))
    },
  }
}
