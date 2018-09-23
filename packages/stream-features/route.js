'use strict'

module.exports = function route() {
  return function({stanza, entity}, next) {
    if (!stanza.is('features', 'http://etherx.jabber.org/streams'))
      return next()
    return next()
      .then(() => {
        if (entity.jid) entity._status('online', entity.jid)
      })
      .catch(err => {
        entity.emit('error', err)
      })
  }
}
