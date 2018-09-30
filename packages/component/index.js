'use strict'

const {Component, xml, jid} = require('@xmpp/component-core')

const _reconnect = require('@xmpp/reconnect')
const _middleware = require('@xmpp/middleware')

function component(options) {
  const {password, service, domain} = options

  const entity = new Component({service, domain})

  const reconnect = _reconnect({entity})
  const middleware = _middleware({entity})

  entity.on('open', async el => {
    try {
      const {id} = el.attrs
      if (typeof password === 'function') {
        await password(creds => entity.authenticate(id, creds))
      } else {
        await entity.authenticate(id, password)
      }
    } catch (err) {
      entity.emit('error', err)
    }
  })

  return Object.assign(entity, {
    entity,
    // FIXME remove
    component: entity,
    reconnect,
    middleware,
  })
}

module.exports.Component = Component
module.exports.xml = xml
module.exports.jid = jid
module.exports.component = component
// FIXME remove
module.exports.xmpp = component
