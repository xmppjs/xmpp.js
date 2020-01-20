'use strict'

module.exports = function route() {
  return async function({stanza, entity}, next) {
    if (!stanza.is('features', 'http://etherx.jabber.org/streams'))
      return next()

    const prevent = await next()
    if (!prevent && entity.jid) entity._status('online', entity.jid)
  }
}
