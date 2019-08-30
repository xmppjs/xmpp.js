'use strict'

const test = require('ava')
const {component, xml, jid} = require('../packages/component')
const debug = require('../packages/debug')
const server = require('../server')

const password = 'mysecretcomponentpassword'
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

test.serial('component', async t => {
  t.plan(6)

  const xmpp = component(options)
  t.context.xmpp = xmpp
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

  const id = await xmpp.start()

  t.true(id instanceof jid.JID)
  t.is(id.toString(), 'component.localhost')
  await xmpp.stop
})

test.serial.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const xmpp = component(options)
  debug(xmpp)

  xmpp.on('error', () => {})

  xmpp.on('online', async () => {
    c++
    t.pass()
    if (c === 2) {
      await xmpp.stop()
      t.end()
    } else {
      server.restart()
    }
  })

  xmpp.start()

  t.context.xmpp = xmpp
})

test.serial.cb('does not reconnect when stop is called', t => {
  t.plan(2)

  const xmpp = component(options)
  debug(xmpp)

  xmpp.on('online', async () => {
    await xmpp.stop()
    await server.stop()
    t.end()
  })

  xmpp.on('close', () => t.pass())

  xmpp.on('offline', () => t.pass())

  xmpp.start()

  t.context.xmpp = xmpp
})
