'use strict'

const test = require('ava')
const {client, xml, jid} = require('../packages/client')
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
  if (t.context.xmpp && t.context.xmpp.status === 'online') {
    return t.context.xmpp.stop()
  }
})

test.serial.cb('client', t => {
  t.plan(7)

  const xmpp = client({credentials, service: domain})
  debug(client)

  xmpp.on('connect', () => {
    t.pass()
  })

  xmpp.once('open', el => {
    t.is(xmpp.domain, 'localhost')
    t.true(el instanceof xml.Element)
  })

  xmpp.on('online', address => {
    t.true(address instanceof jid.JID)
    t.is(address.bare().toString(), JID)
  })

  xmpp.start().then(address => {
    t.true(address instanceof jid.JID)
    t.is(address.bare().toString(), JID)
    t.end()
  })

  t.context.xmpp = xmpp
})

test.serial.cb('bad credentials', t => {
  t.plan(6)

  const xmpp = client({
    service: domain,
    credentials: {...credentials, password: 'nope'},
  })
  debug(client)

  let error

  xmpp.on('connect', () => t.pass())
  xmpp.once('open', () => t.pass())

  xmpp.on('online', () => t.fail())

  xmpp.on('error', err => {
    t.true(err instanceof Error)
    t.is(err.name, 'SASLError')
    t.is(err.condition, 'not-authorized')
    error = err
  })

  xmpp
    .start()
    .then(() => t.fail())
    .catch(err => {
      t.is(err, error)
      t.end()
    })

  t.context.xmpp = xmpp
})

test.serial.cb('reconnects when server restarts', t => {
  t.plan(2)
  let c = 0

  const xmpp = client({credentials, service: domain})
  debug(client)

  xmpp.on('error', () => {})

  xmpp.on('online', async () => {
    c++
    t.pass()
    if (c === 2) {
      xmpp.stop().then(() => {
        t.end()
      })
    } else {
      await server.restart()
    }
  })

  xmpp.start()

  t.context.xmpp = xmpp
})

test.serial.cb('does not reconnect when stop is called', t => {
  t.plan(5)

  const xmpp = client({service: domain, credentials})
  debug(client)

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

test.serial.cb('anonymous authentication', t => {
  t.plan(5)

  const xmpp = client({service: domain, domain: 'anon.' + domain})
  debug(client)

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

test.serial('auto', t => {
  const xmpp = client({credentials, service: domain})
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('ws IPv4', t => {
  const xmpp = client({
    credentials,
    service: 'ws://127.0.0.1:5280/xmpp-websocket',
    domain,
  })
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('ws IPv6', t => {
  const xmpp = client({
    credentials,
    service: 'ws://[::1]:5280/xmpp-websocket',
    domain,
  })
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('ws domain', t => {
  const xmpp = client({
    credentials,
    service: 'ws://localhost:5280/xmpp-websocket',
  })
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('wss IPv4', t => {
  const xmpp = client({
    credentials,
    service: 'wss://127.0.0.1:5281/xmpp-websocket',
    domain,
  })
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('wss IPv6', t => {
  const xmpp = client({
    credentials,
    service: 'wss://[::1]:5281/xmpp-websocket',
    domain,
  })
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('wss domain', t => {
  const xmpp = client({
    credentials,
    service: 'wss://localhost:5281/xmpp-websocket',
  })
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpp IPv4', t => {
  const xmpp = client({credentials, service: 'xmpp://127.0.0.1:5222', domain})
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpp IPv6', t => {
  const xmpp = client({credentials, service: 'xmpp://[::1]:5222', domain})
  debug(client)
  t.context.xmpp = xmpp
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpp domain', t => {
  const xmpp = client({credentials, service: 'xmpp://localhost:5222'})
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpps IPv4', t => {
  const xmpp = client({
    credentials,
    service: 'xmpps://127.0.0.1:5223',
    domain,
  })
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpps IPv6', t => {
  const xmpp = client({credentials, service: 'xmpps://[::1]:5223', domain})
  debug(client)
  t.context.xmpp = xmpp
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})

test.serial('xmpps domain', t => {
  const xmpp = client({credentials, service: 'xmpps://localhost:5223'})
  debug(client)
  t.context.xmpp = xmpp
  return xmpp.start().then(id => t.is(id.bare().toString(), JID))
})
