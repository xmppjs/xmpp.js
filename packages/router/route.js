'use strict'

function matches(event, ctx) {
  const {name, type, stanza} = ctx
  const [child] = stanza.children

  const events = [`${name}`]

  if (type) {
    events.push(`${name}-${type}`)
  }

  if (child && child.findNS) {
    const NS = child.findNS()
    events.push(`${name}/${NS}/${child.name}`)
    if (type) {
      events.push(`${name}-${type}/${NS}/${child.name}`)
    }
  }

  return events.includes(event)
}

module.exports = function route(event, handler) {
  return function(ctx, next) {
    if (!matches(event, ctx)) return next()
    return handler(ctx, next)
  }
}
