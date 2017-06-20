'use strict'

const test = require('ava')
const {client, xml, jid} = require('../packages/client')
const debug = require('../packages/debug')
const server = require('../server')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const USERNAME = 'node-xmpp'
const PASSWORD = 'foobar'
const domain = 'localhost'
const JID = jid(USERNAME, domain).toString()

test.beforeEach(t => {
  const entity = client()
  debug(entity)
  t.context.entity = entity
  return server.restart()
})

test.afterEach(t => {
  if (t.context.entity.jid) {
    return t.context.entity.stop()
  }
})

test.cb('client', t => {
  t.plan(8)

  const {entity} = t.context

  entity.on('connect', () => {
    t.pass()
  })

  entity.once('open', el => {
    t.is(entity.domain, 'localhost')
    t.true(el instanceof xml.Element)
  })

  entity.handle('authenticate', auth => {
    t.is(typeof auth, 'function')
    return auth(USERNAME, PASSWORD)
  })

  entity.on('online', id => {
    t.true(id instanceof jid.JID)
    t.is(id.bare().toString(), JID)
  })

  entity.start(domain)
    .then(id => {
      t.true(id instanceof jid.JID)
      t.is(id.bare().toString(), JID)
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

  entity.handle('authenticate', auth => {
    return auth('foo', 'bar')
      .then(() => t.fail())
      .catch(err => {
        t.true(err instanceof Error)
        t.is(err.condition, 'not-authorized')
        error = err
        throw err
      })
  })

  entity.on('error', err => {
    t.is(err, error)
  })

  entity.start(domain)
    .then(() => t.fail())
    .catch(err => {
      t.is(err, error)
      t.end()
    })
})

test.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const entity = client()
  debug(entity)

  entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
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

  entity.start(domain)
})

test.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const entity = client()
  debug(entity)

  entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
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

  entity.start(domain)
})

test('auto', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start(domain)
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('ws IPv4', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start({uri: 'ws://127.0.0.1:5280/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('ws IPv6', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start({uri: 'ws://[::1]:5280/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('ws domain', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start('ws://localhost:5280/xmpp-websocket')
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('wss IPv4', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start({uri: 'wss://127.0.0.1:5281/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.skip('wss IPv6', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start({uri: 'wss://[::1]:5281/xmpp-websocket', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('wss domain', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start('wss://localhost:5281/xmpp-websocket')
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpp IPv4', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start({uri: 'xmpp://127.0.0.1:5222', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test.skip('xmpp IPv6', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return t.context.entity.start({uri: 'xmpp://[::1]:5222', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpp domain', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start('xmpp://localhost:5222')
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps IPv4', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start({uri: 'xmpps://127.0.0.1:5223', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps IPv6', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return t.context.entity.start({uri: 'xmpps://[::1]:5223', domain})
    .then(id => t.is(id.bare().toString(), JID))
})

test('xmpps domain', t => {
  t.context.entity.handle('authenticate', auth => {
    return auth(USERNAME, PASSWORD)
  })
  return t.context.entity.start('xmpps://localhost:5223')
    .then(id => t.is(id.bare().toString(), JID))
})
