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

test.serial('client', async t => {
  t.plan(6)

  const xmpp = client({credentials, service: domain})
  t.context.xmpp = xmpp
  debug(xmpp)

  xmpp.on('connect', () => {
    t.pass()
  })

  xmpp.once('open', el => {
    t.true(el instanceof xml.Element)
  })

  xmpp.on('online', address => {
    t.true(address instanceof jid.JID)
    t.is(address.bare().toString(), JID)
  })

  const address = await xmpp.start()
  t.true(address instanceof jid.JID)
  t.is(address.bare().toString(), JID)
})

test.serial.cb('bad credentials', t => {
  t.plan(6)

  const xmpp = client({
    service: domain,
    credentials: {...credentials, password: 'nope'},
  })
  debug(xmpp)

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

test.serial.cb('reconnects when server restarts gracefully', t => {
  t.plan(2)
  let c = 0

  const xmpp = client({credentials, service: domain})
  debug(xmpp)

  xmpp.on('error', () => {})

  xmpp.on('online', async () => {
    c++
    t.pass()
    if (c === 2) {
      await xmpp.stop()
      t.end()
    } else {
      await server.restart()
    }
  })

  xmpp.start()

  t.context.xmpp = xmpp
})

test.serial.cb('reconnects when server restarts non-gracefully', t => {
  t.plan(2)
  let c = 0

  const xmpp = client({credentials, service: domain})
  debug(xmpp)

  xmpp.on('error', () => {})

  xmpp.on('online', async () => {
    c++
    t.pass()
    if (c === 2) {
      await xmpp.stop()
      t.end()
    } else {
      await server.restart('SIGKILL')
    }
  })

  xmpp.start()

  t.context.xmpp = xmpp
})

test.serial.cb('does not reconnect when stop is called', t => {
  t.plan(2)

  const xmpp = client({service: domain, credentials})
  debug(xmpp)

  xmpp.on('online', async () => {
    await xmpp.stop()
    server.stop()
    t.end()
  })

  xmpp.on('close', () => t.pass())

  xmpp.on('offline', () => t.pass())

  xmpp.start()

  t.context.xmpp = xmpp
})

test.serial.cb('anonymous authentication', t => {
  t.plan(2)

  const xmpp = client({service: domain, domain: 'anon.' + domain})
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

test.serial('auto', async t => {
  const xmpp = client({credentials, service: domain})
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('ws IPv4', async t => {
  const xmpp = client({
    credentials,
    service: 'ws://127.0.0.1:5280/xmpp-websocket',
    domain,
  })
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('ws IPv6', async t => {
  const xmpp = client({
    credentials,
    service: 'ws://[::1]:5280/xmpp-websocket',
    domain,
  })
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

test.serial('ws domain', async t => {
  const xmpp = client({
    credentials,
    service: 'ws://localhost:5280/xmpp-websocket',
  })
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('wss IPv4', async t => {
  const xmpp = client({
    credentials,
    service: 'wss://127.0.0.1:5281/xmpp-websocket',
    domain,
  })
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

// Prosody 404 https://prosody.im/issues/issue/932
test.serial.skip('wss IPv6', async t => {
  const xmpp = client({
    credentials,
    service: 'wss://[::1]:5281/xmpp-websocket',
    domain,
  })
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

test.serial('wss domain', async t => {
  const xmpp = client({
    credentials,
    service: 'wss://localhost:5281/xmpp-websocket',
  })
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

test.serial('xmpp IPv4', async t => {
  const xmpp = client({credentials, service: 'xmpp://127.0.0.1:5222', domain})
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

test.serial('xmpp IPv6', async t => {
  const xmpp = client({credentials, service: 'xmpp://[::1]:5222', domain})
  debug(xmpp)
  t.context.xmpp = xmpp
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }

  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

test.serial('xmpp domain', async t => {
  const xmpp = client({credentials, service: 'xmpp://localhost:5222'})
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

test.serial('xmpps IPv4', async t => {
  const xmpp = client({
    credentials,
    service: 'xmpps://127.0.0.1:5223',
    domain,
  })
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

test.serial('xmpps IPv6', async t => {
  const xmpp = client({credentials, service: 'xmpps://[::1]:5223', domain})
  debug(xmpp)
  t.context.xmpp = xmpp
  // No local IPv6 on travis https://github.com/travis-ci/travis-ci/issues/4964
  if (process.env.TRAVIS) {
    return t.pass()
  }

  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})

test.serial('xmpps domain', async t => {
  const xmpp = client({credentials, service: 'xmpps://localhost:5223'})
  debug(xmpp)
  t.context.xmpp = xmpp
  const address = await xmpp.start()
  t.is(address.bare().toString(), JID)
})
