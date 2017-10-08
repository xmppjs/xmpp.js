'use strict'

const xid = require('@xmpp/id')

module.exports = function request(conn, handlers, stanza, params) {
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

  const rid = `${stanza.attrs.type}-${(stanza.attrs.to || '').toString()}-${
    stanza.attrs.id
  }`

  return conn.send(stanza).then(() => {
    return new Promise((resolve, reject) => {
      handlers[stanza.attrs.id] = [reject, resolve]
      console.log(handlers)
    })
  })
}
