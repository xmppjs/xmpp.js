'use strict'

const xml = require('@xmpp/xml')

const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

module.exports = function({middleware, entity}) {
  const getters = new Map()
  const setters = new Map()

  middleware.use(({type, name, id, stanza}, next) => {
    if (name !== 'iq' || !['get', 'set'].includes(type) || !id) return next()

    const iq = xml('iq', {
      to: stanza.attrs.from,
      id,
    })

    const [child] = stanza.children
    const handler = (type === 'get' ? getters : setters).get(child.attrs.xmlns)

    if (!handler) {
      iq.attrs.type = 'error'
      iq.append(child.clone())
      iq.append(
        xml('error', {type: 'cancel'}, xml('service-unvailable', NS_STANZA))
      )
      entity.send(iq)
      return
    }

    Promise.resolve(handler(child))
      .then(el => {
        iq.attrs.type = 'result'
        if (el) {
          iq.append(el)
        }
        entity.send(iq)
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
        entity.send(iq)
      })
  })

  return {
    get(ns, fn) {
      getters.set(ns, fn)
    },

    set(ns, fn) {
      setters.set(ns, fn)
    },
  }
}
