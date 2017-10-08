'use strict'

module.exports = function(id, handler) {
  return function(ctx, next) {
    if (ctx.name !== 'iq') return next()
    if (ctx.id !== id) return next()

    if (ctx.type === 'error') {
      ctx.error = ctx.stanza.getChild('error')
    } else if (ctx.type === 'result') {
      ctx.result = [ctx.stanza.children]
    } else {
      return next()
    }

    return handler(ctx, next)
  }
}
