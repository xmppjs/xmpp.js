'use strict'

const test = require('ava')
const {mockClient, delay} = require('@xmpp/test')

test('without resource', async t => {
  const resource = Math.random().toString()
  const jid = 'foo@bar/' + resource

  const {entity} = mockClient()

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>
  )

  entity.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>
  )

  const child = await entity.catchOutgoingSet()
  t.deepEqual(child, <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />)

  await delay()

  t.is(entity.jid.toString(), jid)
})

test('with string resource', async t => {
  const resource = Math.random().toString()
  const jid = 'foo@bar/' + resource

  const {entity} = mockClient({resource})

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>
  )

  entity.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>
  )

  const child = await entity.catchOutgoingSet()
  t.deepEqual(
    child,
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <resource>{resource}</resource>
    </bind>
  )

  await delay()

  t.is(entity.jid.toString(), jid)
})

test('with function resource', async t => {
  const resource = Math.random().toString()
  const jid = 'foo@bar/' + resource

  const {entity} = mockClient({
    resource: async bind => {
      await delay()
      t.is((await bind(resource)).toString(), jid)
    },
  })

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>
  )

  entity.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>
  )

  const child = await entity.catchOutgoingSet()
  t.deepEqual(
    child,
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <resource>{resource}</resource>
    </bind>
  )

  await delay()

  t.is(entity.jid.toString(), jid)
})
