'use strict'

const {Component, xml, jid} = require('@xmpp/component-core')
const reconnect = require('@xmpp/reconnect')

function xmpp() {
  const component = new Component()
  return {
    component,
    reconnect: reconnect(component),
  }
}

module.exports.Component = Component
module.exports.xml = xml
module.exports.jid = jid
module.exports.xmpp = xmpp
