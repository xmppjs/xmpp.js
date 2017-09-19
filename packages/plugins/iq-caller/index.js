'use strict'

const {plugin, xml} = require('@xmpp/plugin')

module.exports = plugin('iq-caller', {
  start() {
    this.handlers = new Map()
    this.handler = stanza => {
      if (!this.match(stanza)) {
        return
      }

      const {id} = stanza.attrs

      const handler = this.handlers.get(id)

      if (!handler) {
        return
      }

      if (stanza.attrs.type === 'error') {
        handler[1](stanza.getChild('error'))
      } else {
        handler[0](stanza.children[0])
      }
      this.handlers.delete(id)
    }
    this.entity.on('element', this.handler)
  },
  stop() {
    this.entity.removeListener('element', this.handler)
  },
  id() {
    let id
    while (!id) {
      id = Math.random()
        .toString(36)
        .substr(2, 12)
    }
    return id
  },
  match(stanza) {
    return (
      stanza.name === 'iq' &&
      (stanza.attrs.type === 'error' || stanza.attrs.type === 'result')
    )
  },
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
      stanza.attrs.id = this.id()
    }

    return this.entity.send(stanza).then(() => {
      return new Promise((resolve, reject) =>
        this.handlers.set(stanza.attrs.id, [resolve, reject])
      )
    })
  },
})
