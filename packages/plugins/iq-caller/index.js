'use strict'

const {plugin, xml} = require('@xmpp/plugin')
const stanzaRouter = require('../stanza-router')

module.exports = plugin('iq-caller', {
  start() {
    this.handlers = new Map()
    this.handler = stanza => {
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
    this.plugins['stanza-router'].add(this.match, this.handler)
  },
  stop() {
    delete this.handlers
    this.entity.plugins['stanza-router'].remove(this.match, this.handler)
    delete this.handler
  },
  id() {
    let id
    while (!id) {
      id = Math.random().toString(36).substr(2, 12)
    }
    return id
  },
  match(stanza) {
    return (
      stanza.name === 'iq' &&
      (stanza.attrs.type === 'error' || stanza.attrs.type === 'result')
    )
  },
  get(el, ...args) {
    const iq = xml`<iq type='get'/>`
    iq.cnode(el)
    return this.request(iq, ...args)
  },
  set(el, ...args) {
    const iq = xml`<iq type='set'/>`
    iq.cnode(el)
    return this.request(iq, ...args)
  },
  request(stanza, to) {
    return new Promise((resolve, reject) => {
      if (to && typeof to === 'string' && !stanza.attrs.to) {
        stanza.attrs.to = to
      }
      if (!stanza.attrs.id) {
        stanza.attrs.id = this.id()
      }

      this.handlers.set(stanza.attrs.id, [resolve, reject])

      this.entity.send(stanza)
    })
  },
}, [stanzaRouter])
