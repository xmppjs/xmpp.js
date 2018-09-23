'use strict'

const test = require('ava')
const {xmpp, xml, jid} = require('../packages/client')
const debug = require('../packages/debug')
const server = require('../server')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const username = 'client'
const password = 'foobar'
const credentials = {username, password}
const domain = 'localhost'
const JID = jid(username, domain).toString()

test.beforeEach(() => {
  return server.restart()
})

test.afterEach(t => {
  if (t.context.client) {
    return t.context.client.stop()
  }
})

test.cb('client', t => {
  t.plan(7)

  const {client} = xmpp({credentials})
  debug(client)

  client.on('connect', () => {
    t.pass()
  })

  client.once('open', el => {
    t.is(client.domain, 'localhost')
    t.true(el instanceof xml.Element)
  })

  client.on('online', id => {
    t.true(id instanceof jid.JID)
    t.is(id.bare().toString(), JID)
  })

  client.start(domain).then(id => {
    t.true(id instanceof jid.JID)
    t.is(id.bare().toString(), JID)
    t.end()
  })

  t.context.client = client
})

test.cb('bad credentials', t => {
  t.plan(6)

  const {client} = xmpp({
    credentials: Object.assign({}, credentials, {password: 'nope'}),
  })
  debug(client)

  let error

  client.on('connect', () => t.pass())
  client.once('open', () => t.pass())

  client.on('online', () => t.fail())

  client.on('error', err => {
    t.true(err instanceof Error)
    t.is(err.name, 'SASLError')
    t.is(err.condition, 'not-authorized')
    error = err
  })

  client
    .start(domain)
    .then(() => t.fail())
    .catch(err => {
      t.is(err, error)
      t.end()
    })

  t.context.client = client
})

test.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const {client} = xmpp({credentials})
  debug(client)

  client.on('error', () => {})

  client.on('online', () => {
    c++
    t.pass()
    if (c === 2) {
      client.stop().then(() => {
        t.end()
      })
    } else {
      server.restart()
    }
  })

  client.start(domain)

  t.context.client = client
})

test.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const {client} = xmpp({credentials})
  debug(client)

  client.on('online', () => {
    t.pass()
    client.stop().then(() => {
      t.pass()
      server.stop().then(() => {
        t.pass()
        t.end()
      })
    })
  })

  client.on('close', () => t.pass())

  client.on('offline', () => t.pass())

  client.start(domain)

  t.context.client = client
})

test.cb('anonymous authentication', t => {
  t.plan(5)

  const {client} = xmpp()
  debug(client)

  client.on('online', () => {
    t.pass()
    client.stop().then(() => {
      t.pass()
      server.stop().then(() => {
        t.pass()
        t.end()
      })
    })
  })

  client.on('close', () => t.pass())

  client.on('offline', () => t.pass())

  client.start({uri: domain, domain: 'anon.' + domain})

  t.context.client = client
})

test('auto', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client.start(domain).then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('ws IPv4', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start({uri: 'ws://127.0.0.1:5280/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('ws IPv6', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start({uri: 'ws://[::1]:5280/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('ws domain', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start('ws://localhost:5280/xmpp-websocket')
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('wss IPv4', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start({uri: 'wss://127.0.0.1:5281/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('wss IPv6', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start({uri: 'wss://[::1]:5281/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('wss domain', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start('wss://localhost:5281/xmpp-websocket')
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpp IPv4', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start({uri: 'xmpp://127.0.0.1:5222', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpp IPv6', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return client
    .start({uri: 'xmpp://[::1]:5222', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpp domain', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start('xmpp://localhost:5222')
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps IPv4', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start({uri: 'xmpps://127.0.0.1:5223', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps IPv6', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return client
    .start({uri: 'xmpps://[::1]:5223', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps domain', t => {
  const {client} = xmpp({credentials})
  debug(client)
  t.context.client = client
  return client
    .start('xmpps://localhost:5223')
    .then(id => t.is(id.bare().toString(), JID))
})
