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

test.serial.cb('client', t => {
  t.plan(7)

  const {client} = xmpp({credentials, service: domain})
  debug(client)

  client.on('connect', () => {
    t.pass()
  })

  client.once('open', el => {
    t.is(client.domain, 'localhost')
    t.true(el instanceof xml.Element)
  })

  client.on('online', address => {
    t.true(address instanceof jid.JID)
    t.is(address.bare().toString(), JID)
  })

  client.start().then(address => {
    t.true(address instanceof jid.JID)
    t.is(address.bare().toString(), JID)
    t.end()
  })

  t.context.client = client
})

test.serial.cb('bad credentials', t => {
  t.plan(6)

  const {client} = xmpp({
    service: domain,
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
    .start()
    .then(() => t.fail())
    .catch(err => {
      t.is(err, error)
      t.end()
    })

  t.context.client = client
})

test.serial.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const {client} = xmpp({credentials, service: domain})
  debug(client)

  client.on('error', () => {})

  client.on('online', async () => {
    c++
    t.pass()
    if (c === 2) {
      client.stop().then(() => {
        t.end()
      })
    } else {
      await server.restart()
    }
  })

  client.start()

  t.context.client = client
})

test.serial.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const {client} = xmpp({service: domain, credentials})
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

  client.start()

  t.context.client = client
})

test.serial.cb('anonymous authentication', t => {
  t.plan(5)

  const {client} = xmpp({service: domain, domain: 'anon.' + domain})
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

  client.start()

  t.context.client = client
})

test.serial('auto', t => {
  const {client} = xmpp({credentials, service: domain})
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('ws IPv4', t => {
  const {client} = xmpp({
    credentials,
    service: 'ws://127.0.0.1:5280/xmpp-websocket',
    domain,
  })
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('ws IPv6', t => {
  const {client} = xmpp({
    credentials,
    service: 'ws://[::1]:5280/xmpp-websocket',
    domain,
  })
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('ws domain', t => {
  const {client} = xmpp({
    credentials,
    service: 'ws://localhost:5280/xmpp-websocket',
  })
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('wss IPv4', t => {
  const {client} = xmpp({
    credentials,
    service: 'wss://127.0.0.1:5281/xmpp-websocket',
    domain,
  })
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('wss IPv6', t => {
  const {client} = xmpp({
    credentials,
    service: 'wss://[::1]:5281/xmpp-websocket',
    domain,
  })
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('wss domain', t => {
  const {client} = xmpp({
    credentials,
    service: 'wss://localhost:5281/xmpp-websocket',
  })
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpp IPv4', t => {
  const {client} = xmpp({credentials, service: 'xmpp://127.0.0.1:5222', domain})
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpp IPv6', t => {
  const {client} = xmpp({credentials, service: 'xmpp://[::1]:5222', domain})
  debug(client)
  t.context.client = client
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpp domain', t => {
  const {client} = xmpp({credentials, service: 'xmpp://localhost:5222'})
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpps IPv4', t => {
  const {client} = xmpp({
    credentials,
    service: 'xmpps://127.0.0.1:5223',
    domain,
  })
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpps IPv6', t => {
  const {client} = xmpp({credentials, service: 'xmpps://[::1]:5223', domain})
  debug(client)
  t.context.client = client
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return client.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpps domain', t => {
  const {client} = xmpp({credentials, service: 'xmpps://localhost:5223'})
  debug(client)
  t.context.client = client
  return client.start().then(id => t.is(id.bare().toString(), JID))
})
