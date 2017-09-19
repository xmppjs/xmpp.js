'use strict'

const {plugin, xml} = require('@xmpp/plugin')

const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

module.exports = plugin('iq-callee', {
  getters: new Map(),
  setters: new Map(),
  match(stanza) {
    return (
      stanza.is('iq') &&
      stanza.attrs.id &&
      (stanza.attrs.type === 'get' || stanza.attrs.type === 'set')
    )
  },

  get(ns, fn) {
    this.getters.set(ns, fn)
  },

  set(ns, fn) {
    this.setters.set(ns, fn)
  },

  start() {
    this.handler = stanza => {
      if (!this.match(stanza)) {
        return
      }

      const {id, type} = stanza.attrs

      const iq = xml('iq', {
        to: stanza.attrs.from,
        id,
      })

      const [child] = stanza.children
      const handler = (type === 'get' ? this.getters : this.setters).get(
        child.attrs.xmlns
      )

      if (!handler) {
        iq.attrs.type = 'error'
        iq.append(child.clone())
        iq.append(
          xml('error', {type: 'cancel'}, xml('service-unvailable', NS_STANZA))
        )
        this.entity.send(iq)
        return
      }

      Promise.resolve(handler(child))
        .then(el => {
          iq.attrs.type = 'result'
          if (el) {
            iq.append(el)
          }
          this.entity.send(iq)
        })
        .catch(err => {
          iq.attrs.type = 'error'
          iq.append(child.clone())
          if (err instanceof xml.Element) {
            iq.append(err)
          } else if (err) {
            iq.append(
              xml(
                'error',
                {type: 'cancel'},
                xml('internal-server-error', NS_STANZA)
              )
            )
          }
          this.entity.send(iq)
        })
    }
    this.entity.on('element', this.handler)
  },
  stop() {
    this.entity.removeListener('element', this.handler)
    delete this.handler
  },
})
