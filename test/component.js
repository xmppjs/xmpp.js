'use strict'

const test = require('ava')
const {xmpp, xml, jid} = require('../packages/component')
const debug = require('../packages/debug')
const server = require('../server')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

test.beforeEach(() => {
  return server.restart()
})

test.afterEach(t => {
  if (t.context.component) {
    return t.context.component.stop()
  }
})

test.cb('component', t => {
  t.plan(8)

  const {component} = xmpp()
  debug(component)

  component.on('connect', () => {
    t.pass()
  })

  component.on('open', el => {
    t.true(el instanceof xml.Element)
  })

  component.handle('authenticate', auth => {
    t.is(typeof auth, 'function')
    return auth('foobar').then(() => t.pass())
  })

  component.on('online', id => {
    t.true(id instanceof jid.JID)
    t.is(id.toString(), 'component.localhost')
  })

  component
    .start({uri: 'xmpp://localhost:5347', domain: 'component.localhost'})
    .then(id => {
      t.true(id instanceof jid.JID)
      t.is(id.toString(), 'component.localhost')
      component.stop().then(() => t.end())
    })

  t.context.component = component
})

test.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const {component} = xmpp()
  debug(component)

  component.on('error', () => {})

  component.handle('authenticate', auth => {
    return auth('foobar')
  })

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

  component.start({uri: 'xmpp://localhost:5347', domain: 'component.localhost'})

  t.context.component = component
})

test.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const {component} = xmpp()
  debug(component)

  component.handle('authenticate', auth => {
    return auth('foobar')
  })

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

  component.start({uri: 'xmpp://localhost:5347', domain: 'component.localhost'})

  t.context.component = component
})
