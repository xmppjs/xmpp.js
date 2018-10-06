'use strict'

module.exports = function route() {
  return async function({stanza, entity}, next) {
    if (!stanza.is('features', 'http://etherx.jabber.org/streams'))
      return next()

    await next()
    if (entity.jid) entity._status('online', entity.jid)
  }
}
