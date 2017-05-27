'use strict'

const {plugin, xml} = require('@xmpp/plugin')
const stanzaRouter = require('../stanza-router')

const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

module.exports = plugin('iq-callee', {
  NS_STANZA,
  match (stanza) {
    return (
      stanza.is('iq') &&
      (
        stanza.attrs.type === 'get' ||
        stanza.attrs.type === 'set'
      )
    )
  },
  add (name, NS, handle) {
    this.calls.set(`${name}:${NS}`, handle)
  },
  remove (name, NS) {
    this.calls.delete(`${name}:${NS}`)
  },
  start () {
    this.calls = new Map()
    this.handler = (stanza) => {
      const iq = xml`<iq to='${stanza.attrs.from}' from='${stanza.attrs.to}' id='${stanza.attrs.id}'/>`

      const child = stanza.children[0]
      const handler = this.calls.get(`${child.name}:${child.getNS()}`)

      if (!handler) {
        iq.attrs.type = 'error'
        iq.cnode(child.clone())
        iq.c('error', {type: 'cancel'})
            .c('service-unavailable', NS_STANZA)
      } else {
        Promise.resolve(handler(stanza))
        .then((res) => {
          iq.attrs.type = 'result'
          if (xml.isElement(res)) {
            iq.cnode(res)
          }
        })
        .catch((err) => {
          iq.attrs.type = 'error'
          if (xml.isElement(err)) {
            iq.cnode(err)
          } else {
            iq.c('error', {type: 'cancel'})
                .c('internal-server-error', NS_STANZA)
          }
        })
      }

      this.entity.send(iq)
    }
    this.plugins['stanza-router'].add(this.match, this.handler)
  },
  stop () {
    delete this.calls
    this.plugins['stanza-router'].remove(this.match)
    delete this.handler
  },
}, [stanzaRouter])
