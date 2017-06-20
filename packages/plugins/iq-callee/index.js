'use strict'

const {plugin, xml} = require('@xmpp/plugin')
const stanzaRouter = require('../stanza-router')

const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

module.exports = plugin('iq-callee', {
  NS_STANZA,
  match(stanza) {
    return (
      stanza.is('iq') &&
      (
        stanza.attrs.type === 'get' ||
        stanza.attrs.type === 'set'
      )
    )
  },
  add(name, NS, handle) {
    this.calls.set(`${name}:${NS}`, handle)
  },
  remove(name, NS) {
    this.calls.delete(`${name}:${NS}`)
  },
  response({attrs}) {
    return xml`<iq to='${attrs.from}' from='${attrs.to}' id='${attrs.id}'/>`
  },
  result(iq, reply) {
    const stanza = this.response(iq)
    stanza.attrs.type = 'result'
    if (reply) {
      stanza.cnode(reply)
    }
    return stanza
  },
  error(iq, reply) {
    const stanza = this.response(iq)
    stanza.attrs.type = 'error'
    if (reply instanceof xml.Element) {
      stanza.cnode(reply)
    } else if (reply instanceof Error) {
      stanza.cnode(xml`
        <error type='cancel'>
          <internal-server-error xmlns='${NS_STANZA}'/>
        </error>
      `)
    }
    return stanza
  },
  start() {
    this.calls = new Map()
    this.handler = stanza => {
      const [child] = stanza.children
      const handler = this.calls.get(`${child.name}:${child.attrs.xmlns || ''}`)

      if (handler) {
        Promise.resolve(handler(stanza))
          .then(res => this.result(stanza, res))
          .catch(err => this.error(stanza, err)).then(iq => this.entity.send(iq))
      } else {
        this.entity.send(this.error(stanza, xml`
          <error type='cancel'>
            <service-unavailable xmlns='${NS_STANZA}'/>
          </error>
        `))
      }
    }
    this.plugins['stanza-router'].add(this.match, this.handler)
  },
  stop() {
    delete this.calls
    this.plugins['stanza-router'].remove(this.match)
    delete this.handler
  },
}, [stanzaRouter])
