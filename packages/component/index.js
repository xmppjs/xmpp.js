'use strict'

const entries = Object.entries || require('object.entries') // eslint-disable-line node/no-unsupported-features
const {Component, xml, jid} = require('@xmpp/component-core')

const reconnect = require('@xmpp/reconnect')
const middleware = require('@xmpp/middleware')
const router = require('@xmpp/router')
const packages = {reconnect, middleware, router}

function xmpp() {
  const component = new Component()
  return Object.assign(
    {component},
    ...entries(packages)
      // Ignore browserify stubs
      .filter(([, v]) => typeof v === 'function')
      .map(([k, v]) => ({[k]: v(component)}))
  )
}

module.exports.Component = Component
module.exports.xml = xml
module.exports.jid = jid
module.exports.xmpp = xmpp
