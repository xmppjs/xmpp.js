'use strict'

const xml = require('@xmpp/xml')
const stanzaRouter = require('../stanza-router')

const makeId = function () {
  return Math.random().toString().substr(2)
}

const match = function (stanza) {
  return (
    stanza.is('iq') &&
    stanza.attrs.id &&
    (stanza.attrs.type === 'error' || stanza.attrs.type === 'result')
  )
}

function plugin (entity) {
  const handlers = new Map()

  const router = entity.plugin(stanzaRouter)
  router.add(match, (stanza) => {
    const {id} = stanza.attrs

    const handler = handlers.get(id)
    if (!handler) return

    if (stanza.attrs.type === 'error') {
      handler[1](stanza.getChild('error'))
    } else {
      handler[0](stanza.children[0])
    }

    handlers.delete(id)
  })

  return {
    entity,
    handlers,
    get(to, el, options) {
      const iq = xml`<iq type='get' to='${to}'/>`
      iq.cnode(el)
      return this.request(this.entity, iq, options)
    },
    set(to, el, options) {
      const iq = xml`<iq type='set' to='${to}'/>`
      iq.cnode(el)
      return this.request(this.entity, iq, options)
    },
    request(stanza, options = {}) {
      return new Promise((resolve, reject) => {
        stanza = stanza.root()
        if (!stanza.attrs.id) stanza.attrs.id = makeId()

        this.handlers.set(stanza.attrs.id, [resolve, reject])

        entity.send(stanza)
      })
    }
  }
}

module.exports = {
  name: 'iq-caller',
  plugin,
  id: makeId,
}
