'use strict'

const test = require('ava')
const {Component, xml, jid} = require('../packages/component')
const debug = require('../packages/debug')
const server = require('../server')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

test.beforeEach(() => {
  return server.restart()
})

test.cb('component', t => {
  t.plan(8)

  const entity = new Component()
  debug(entity)

  entity.on('connect', () => {
    t.pass()
  })

  entity.on('open', el => {
    t.true(el instanceof xml.Element)
  })

  entity.handle('authenticate', auth => {
    t.is(typeof auth, 'function')
    return auth('foobar').then(() => t.pass())
  })

  entity.on('online', id => {
    t.true(id instanceof jid.JID)
    t.is(id.toString(), 'node-xmpp.localhost')
  })

  entity.start({uri: 'xmpp://localhost:5347', domain: 'node-xmpp.localhost'})
    .then(id => {
      t.true(id instanceof jid.JID)
      t.is(id.toString(), 'node-xmpp.localhost')
      entity.stop().then(() => t.end())
    })
})

test.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const entity = new Component()
  debug(entity)

  entity.handle('authenticate', auth => {
    return auth('foobar')
  })

  entity.on('online', () => {
    c++
    t.pass()
    if (c === 2) {
      entity.stop().then(() => {
        t.end()
      })
    } else {
      server.restart()
    }
  })

  entity.start({uri: 'xmpp://localhost:5347', domain: 'node-xmpp.localhost'})
})

test.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const entity = new Component()
  debug(entity)

  entity.handle('authenticate', auth => {
    return auth('foobar')
  })

  entity.on('online', () => {
    t.pass()
    entity.stop().then(() => {
      t.pass()
      server.stop().then(() => {
        t.pass()
        t.end()
      })
    })
  })

  entity.on('close', () => t.pass())

  entity.on('offline', () => t.pass())

  entity.start({uri: 'xmpp://localhost:5347', domain: 'node-xmpp.localhost'})
})
