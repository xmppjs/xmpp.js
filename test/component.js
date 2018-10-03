'use strict'

const test = require('ava')
const {component, xml, jid} = require('../packages/component')
const debug = require('../packages/debug')
const server = require('../server')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const password = 'foobar'
const service = 'xmpp://localhost:5347'
const domain = 'component.localhost'
const options = {password, service, domain}

test.beforeEach(() => {
  return server.restart()
})

test.afterEach(t => {
  if (t.context.xmpp) {
    return t.context.xmpp.stop()
  }
})

test.serial.cb('component', t => {
  t.plan(6)

  const xmpp = component(options)
  debug(xmpp)

  xmpp.on('connect', () => {
    t.pass()
  })

  xmpp.on('open', el => {
    t.true(el instanceof xml.Element)
  })

  xmpp.on('online', id => {
    t.true(id instanceof jid.JID)
    t.is(id.toString(), 'component.localhost')
  })

  xmpp.start().then(id => {
    t.true(id instanceof jid.JID)
    t.is(id.toString(), 'component.localhost')
    xmpp.stop().then(() => t.end())
  })

  t.context.xmpp = xmpp
})

test.serial.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const xmpp = component(options)
  debug(xmpp)

  xmpp.on('error', () => {})

  xmpp.on('online', () => {
    c++
    t.pass()
    if (c === 2) {
      xmpp.stop().then(() => {
        t.end()
      })
    } else {
      server.restart()
    }
  })

  xmpp.start()

  t.context.xmpp = xmpp
})

test.serial.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const xmpp = component(options)
  debug(xmpp)

  xmpp.on('online', () => {
    t.pass()
    xmpp.stop().then(() => {
      t.pass()
      server.stop().then(() => {
        t.pass()
        t.end()
      })
    })
  })

  xmpp.on('close', () => t.pass())

  xmpp.on('offline', () => t.pass())

  xmpp.start()

  t.context.xmpp = xmpp
})
