'use strict'

const stanzaRouter = require('../stanza-router')
const xml = require('@xmpp/xml')

const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

function matchIq (stanza) {
  return (
    stanza.is('iq') &&
    stanza.attrs.id &&
    (
      stanza.attrs.type === 'get' ||
      stanza.attrs.type === 'set')
  )
}

function plugin (entity) {
  const calls = new Map()

  const router = entity.plugin(stanzaRouter)
  router.add(matchIq, (stanza) => {
    let matched
    const iq = xml`<iq to='${stanza.attrs.from}' from='${stanza.attrs.to}' id='${stanza.attrs.id}'/>`

    calls.forEach((handler, match) => {
      const matching = match(stanza)
      if (!matching) return
      matched = true

      function callback (err, res) {
        if (err) {
          iq.attrs.type = 'error'
          if (xml.isElement(err)) {
            iq.cnode(err)
          }
          // else // FIXME
        } else {
          iq.attrs.type = 'result'
          if (xml.isElement(res)) {
            iq.cnode(res)
          }
        }
      }

      const handled = handler(matching, callback)
      if (xml.isElement(handled)) callback(null, handled)
    })

    if (!matched) {
      iq.attrs.type === 'error'
      iq.cnode(stanza.children[0].clone())
      iq.c('error', {type: 'cancel'})
          .c('service-unavailable', NS_STANZA)
    }

    entity.send(iq)
  })

  return {
    entity,
    calls,
    add (match, handle) {
      calls.set(match, handle)
    }
  }
}

module.exports = {
  NS_STANZA,
  matchIq,
  name: 'iq-callee',
  plugin
}
