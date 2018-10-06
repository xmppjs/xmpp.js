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

function isValidQuery({type, stanza}, child) {
  if (type !== 'get' && type !== 'set') return false
  if (stanza.children.length !== 1) return false
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
    reply.append(child.clone())
  }
  return reply
}

function buildReplyError(ctx, error, child) {
  const reply = buildReply(ctx)
  reply.attrs.type = 'error'
  if (child) {
    reply.append(child.clone())
  }
  reply.append(error)
  return reply
}

function buildError(type, condition) {
  return xml('error', {type}, xml(condition, NS_STANZA))
}

module.exports = function({middleware}) {
  const getters = new Map()
  const setters = new Map()

  middleware.use(async (ctx, next) => {
    if (!isQuery(ctx)) return next()

    const {entity, stanza} = ctx
    const [child] = stanza.children

    if (!isValidQuery(ctx, child)) {
      return buildReplyError(ctx, buildError('modify', 'bad-request'), child)
    }

    const {type} = ctx

    let handler
    if (type === 'get') handler = getters.get(child.attrs.xmlns)
    else if (type === 'set') handler = setters.get(child.attrs.xmlns)

    if (!handler) {
      return buildReplyError(
        ctx,
        buildError('cancel', 'service-unavailable'),
        child
      )
    }

    let reply
    ctx.element = child

    try {
      reply = buildReplyResult(ctx, await handler(ctx))
    } catch (err) {
      if (err instanceof xml.Element) {
        reply = buildReplyError(ctx, err, child)
      } else {
        reply = buildReplyError(
          ctx,
          buildError('cancel', 'internal-server-error'),
          child
        )
        entity.emit('error', err)
      }
    }

    return reply
  })

  return {
    addGetHandler(ns, fn) {
      getters.set(ns, fn)
    },
    get(ns, fn) {
      this.addGetHandler(ns, fn)
    },
    removeGetHandler(ns) {
      getters.remove(ns)
    },
    addSetHandler(ns, fn) {
      setters.set(ns, fn)
    },
    set(ns, fn) {
      this.addSetHandler(ns, fn)
    },
    removeSetHandler(ns) {
      setters.remove(ns)
    },
  }
}
