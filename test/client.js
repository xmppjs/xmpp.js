'use strict'

const test = require('ava')
const {client, xml, jid} = require('../packages/client')
const debug = require('../packages/debug')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const USERNAME = 'node-xmpp'
const PASSWORD = 'foobar'
const domain = 'localhost'
const JID = jid(USERNAME, domain).toString()

test.beforeEach((t) => {
  const entity = client()
  debug(entity)
  t.context.entity = entity

  entity.on('authenticate', auth => {
    auth(USERNAME, PASSWORD)
  })
})

test.afterEach((t) => {
  if (t.jid) return t.context.entity.stop()
})

test.cb('client', t => {
  t.plan(8)

  const {entity} = t.context

  entity.on('connect', () => {
    t.pass()
  })

  entity.once('open', (el) => {
    t.is(entity.domain, 'localhost')
    t.true(el instanceof xml.Element)
  })

  entity.on('authenticate', auth => {
    t.is(typeof auth, 'function')
  })

  entity.on('online', (id) => {
    t.true(id instanceof jid.JID)
    t.is(id.bare().toString(), JID)
  })

  entity.start(domain)
    .then((id) => {
      t.true(id instanceof jid.JID)
      t.is(id.bare().toString(), JID)
    })
    .then(() => {
      t.end()
    })
})

test.cb('bad credentials', t => {
  t.plan(6)

  const entity = client()
  debug(entity)
  let error

  entity.on('connect', () => t.pass())
  entity.once('open', () => t.pass())

  entity.on('authenticated', () => t.fail())
  entity.on('online', () => t.fail())

  entity.on('authenticate', auth => {
    auth('foo', 'bar')
    .then(() => t.fail())
    .catch((err) => {
      t.true(err instanceof Error)
      t.is(err.condition, 'not-authorized')
      error = err
    })
  })

  entity.on('error', (err) => {
    t.is(err, error)
  })

  entity.start(domain)
    .then(() => t.fail())
    .catch((err) => {
      t.is(err, error)
      t.end()
    })
})

// prosody 404
test.skip('ws IPv4', t => {
  return t.context.entity.start({uri: 'ws://127.0.0.1:5280/xmpp-websocket', domain})
    .then((id) => t.is(id.bare().toString(), JID))
})

// prosody 404
test.skip('ws IPv6', t => {
  return t.context.entity.start({uri: 'ws://[::1]:5280/xmpp-websocket', domain})
    .then((id) => t.is(id.bare().toString(), JID))
})

test('ws domain', t => {
  return t.context.entity.start('ws://localhost:5280/xmpp-websocket')
    .then((id) => t.is(id.bare().toString(), JID))
})

// prosody 404
test.skip('wss IPv4', t => {
  return t.context.entity.start({uri: 'wss://127.0.0.1:5281/xmpp-websocket', domain})
    .then((id) => t.is(id.bare().toString(), JID))
})

// prosody 404
test.skip('wss IPv6', t => {
  return t.context.entity.start({uri: 'wss://[::1]:5281/xmpp-websocket', domain})
    .then((id) => t.is(id.bare().toString(), JID))
})

test('wss domain', t => {
  return t.context.entity.start('wss://localhost:5281/xmpp-websocket')
    .then((id) => t.is(id.bare().toString(), JID))
})

test('xmpp IPv4', t => {
  return t.context.entity.start({uri: 'xmpp://127.0.0.1:5222', domain})
    .then((id) => t.is(id.bare().toString(), JID))
})

test.skip('xmpp IPv6', t => {
  // no local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) return t.pass()
  return t.context.entity.start({uri: 'xmpp://[::1]:5222', domain})
    .then((id) => t.is(id.bare().toString(), JID))
})

test('xmpp domain', t => {
  return t.context.entity.start('xmpp://localhost:5222')
    .then((id) => t.is(id.bare().toString(), JID))
})

test('xmpps IPv4', t => {
  return t.context.entity.start({uri: 'xmpps://127.0.0.1:5223', domain})
    .then((id) => t.is(id.bare().toString(), JID))
})

test('xmpps IPv6', t => {
  // no local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) return t.pass()
  return t.context.entity.start({uri: 'xmpps://[::1]:5223', domain})
    .then((id) => t.is(id.bare().toString(), JID))
})

test('xmpps domain', t => {
  return t.context.entity.start('xmpps://localhost:5223')
    .then((id) => t.is(id.bare().toString(), JID))
})
