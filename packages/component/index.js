'use strict'

const {Component, xml, jid} = require('@xmpp/component-core')

const reconnect = require('@xmpp/reconnect')
const middleware = require('@xmpp/middleware')
const router = require('@xmpp/router')
const packages = {reconnect, middleware, router}

function xmpp(options) {
  const {password, service, domain} = options

  const component = new Component({service, domain})

  component.on('open', async el => {
    try {
      const {id} = el.attrs
      if (typeof password === 'function') {
        await password(creds => component.authenticate(id, creds))
      } else {
        await component.authenticate(id, password)
      }
    } catch (err) {
      component.emit('error', err)
    }
  })

  return Object.assign(
    {
      component,
    },
    Object.entries(packages)
      // Ignore browserify stubs
      .filter(([, v]) => typeof v === 'function')
      .map(([k, v]) => ({[k]: v(component)}))
  )
}

module.exports.Component = Component
module.exports.xml = xml
module.exports.jid = jid
module.exports.xmpp = xmpp
