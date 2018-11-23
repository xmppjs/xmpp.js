'use strict'

const {mock, stub} = require('sinon')
const test = require('ava')
const {mockClient, promise, delay} = require('@xmpp/test')
const tls = require('tls')

test('success', async t => {
  const {entity} = mockClient()
  const {socket} = entity
  const host = (entity.options.domain = 'foobar')

  const mockTLS = mock(tls)
  const expectTLSConnect = mockTLS
    .expects('connect')
    .once()
    .withArgs({socket, host})
    .callsFake((options, callback) => {
      process.nextTick(callback)
      return {}
    })

  stub(entity, '_attachSocket')
  stub(entity, 'restart')

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
    </features>
  )

  t.deepEqual(
    await promise(entity, 'send'),
    <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
  )

  entity.mockInput(<proceed xmlns="urn:ietf:params:xml:ns:xmpp-tls" />)

  await delay()

  expectTLSConnect.verify()
})

test('failure', async t => {
  const {entity} = mockClient()

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
    </features>
  )

  t.deepEqual(
    await promise(entity, 'send'),
    <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
  )

  entity.mockInput(<failure xmlns="urn:ietf:params:xml:ns:xmpp-tls" />)

  const err = await promise(entity, 'error')
  t.true(err instanceof Error)
  t.is(err.message, 'STARTTLS_FAILURE')
})
