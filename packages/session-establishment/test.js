'use strict'

const test = require('ava')
const {mockClient, promise, timeout} = require('@xmpp/test')

test('mandatory', async t => {
  const {entity} = mockClient()

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <session xmlns="urn:ietf:params:xml:ns:xmpp-session" />
    </features>
  )

  entity.scheduleIncomingResult()

  const child = await entity.catchOutgoingSet()
  t.deepEqual(child, <session xmlns="urn:ietf:params:xml:ns:xmpp-session" />)

  await promise(entity, 'online')
})

test('optional', async t => {
  const {entity} = mockClient()

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <session xmlns="urn:ietf:params:xml:ns:xmpp-session">
        <optional />
      </session>
    </features>
  )

  const promiseSend = promise(entity, 'send')

  await promise(entity, 'online')

  await timeout(promiseSend, 0).catch(err => {
    t.is(err.name, 'TimeoutError')
  })
})
