'use strict'

const test = require('ava')
const {xmpp, xml, jid} = require('../packages/component')
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
  if (t.context.component) {
    return t.context.component.stop()
  }
})

test.serial.cb('component', t => {
  t.plan(6)

  const {component} = xmpp(options)
  debug(component)

  component.on('connect', () => {
    t.pass()
  })

  component.on('open', el => {
    t.true(el instanceof xml.Element)
  })

  component.on('online', id => {
    t.true(id instanceof jid.JID)
    t.is(id.toString(), 'component.localhost')
  })

  component.start().then(id => {
    t.true(id instanceof jid.JID)
    t.is(id.toString(), 'component.localhost')
    component.stop().then(() => t.end())
  })

  t.context.component = component
})

test.serial.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const {component} = xmpp(options)
  debug(component)

  component.on('error', () => {})

  component.on('online', () => {
    c++
    t.pass()
    if (c === 2) {
      component.stop().then(() => {
        t.end()
      })
    } else {
      server.restart()
    }
  })

  component.start()

  t.context.component = component
})

test.serial.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const {component} = xmpp(options)
  debug(component)

  component.on('online', () => {
    t.pass()
    component.stop().then(() => {
      t.pass()
      server.stop().then(() => {
        t.pass()
        t.end()
      })
    })
  })

  component.on('close', () => t.pass())

  component.on('offline', () => t.pass())

  component.start()

  t.context.component = component
})
