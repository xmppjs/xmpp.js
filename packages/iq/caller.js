'use strict'

const xml = require('@xmpp/xml')
const xid = require('@xmpp/id')

module.exports = function iqCaller({entity, middleware}) {
  const handlers = new Map()

  middleware.use(({type, name, id, stanza}, next) => {
    if (name !== 'iq' || !['error', 'result'].includes(type)) return next()

    const handler = handlers.get(id)

    if (!handler) {
      return next()
    }

    if (type === 'error') {
      handler[1](stanza.getChild('error'))
    } else {
      handler[0](stanza.children[0])
    }
    handlers.delete(id)
  })

  return {
    handlers,
    get(child, ...args) {
      return this.request(xml('iq', {type: 'get'}, child), ...args)
    },
    set(child, ...args) {
      return this.request(xml('iq', {type: 'set'}, child), ...args)
    },
    request(stanza, params) {
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

      return Promise.all([
        new Promise((resolve, reject) => {
          handlers.set(stanza.attrs.id, [resolve, reject])
        }),
        entity.send(stanza).catch(err => {
          handlers.delete(stanza.attrs.id)
          throw err
        }),
      ]).then(([res]) => res)
    },
  }
}
