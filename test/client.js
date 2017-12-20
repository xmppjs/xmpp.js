'use strict'

const test = require('ava')
const {xmpp, xml, jid} = require('../packages/client')
const debug = require('../packages/debug')
const server = require('../server')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const USERNAME = 'client'
const PASSWORD = 'foobar'
const domain = 'localhost'
const JID = jid(USERNAME, domain).toString()

test.beforeEach(t => {
  const {client} = xmpp()
  debug(client)
  t.context.client = client
  return server.restart()
})

test.afterEach(t => {
  if (t.context.client.jid) {
    return t.context.client.stop()
  }
})

test.cb('client', t => {
  t.plan(8)

  const {client} = t.context

  client.on('connect', () => {
    t.pass()
  })

  client.once('open', el => {
    t.is(client.domain, 'localhost')
    t.true(el instanceof xml.Element)
  })

  client.handle('authenticate', auth => {
    t.is(typeof auth, 'function')
    return auth(USERNAME, PASSWORD)
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
})

test.cb('bad credentials', t => {
  t.plan(6)

  const {client} = xmpp()
  debug(client)
  let error

  client.on('connect', () => t.pass())
  client.once('open', () => t.pass())

  client.on('authenticated', () => t.fail())
  client.on('online', () => t.fail())

  client.handle('authenticate', auth => {
    return auth('foo', 'bar')
      .then(() => t.fail())
      .catch(err => {
        t.true(err instanceof Error)
        t.is(err.condition, 'not-authorized')
        error = err
        throw err
      })
  })

  client.on('error', err => {
    t.is(err, error)
  })

  client
    .start(domain)
    .then(() => t.fail())
    .catch(err => {
      t.is(err, error)
      t.end()
    })
})

test.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const {client} = xmpp()
  debug(client)

  client.on('error', () => {})

  client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })

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
})

test.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const {client} = xmpp()
  debug(client)

  client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })

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
})

test('auto', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start(domain)
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('ws IPv4', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start({uri: 'ws://127.0.0.1:5280/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('ws IPv6', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start({uri: 'ws://[::1]:5280/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('ws domain', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start('ws://localhost:5280/xmpp-websocket')
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('wss IPv4', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start({uri: 'wss://127.0.0.1:5281/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('wss IPv6', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start({uri: 'wss://[::1]:5281/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('wss domain', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start('wss://localhost:5281/xmpp-websocket')
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpp IPv4', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start({uri: 'xmpp://127.0.0.1:5222', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test.skip('xmpp IPv6', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return t.context.client
    .start({uri: 'xmpp://[::1]:5222', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpp domain', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start('xmpp://localhost:5222')
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps IPv4', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start({uri: 'xmpps://127.0.0.1:5223', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps IPv6', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return t.context.client
    .start({uri: 'xmpps://[::1]:5223', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps domain', t => {
  t.context.client.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.client
    .start('xmpps://localhost:5223')
    .then(id => t.is(id.bare().toString(), JID))
})
