'use strict'

const test = require('ava')
const {mockClient, delay} = require('@xmpp/test')

test('without resource', async t => {
  const resource = Math.random().toString()
  const jid = 'foo@bar/' + resource

  const {client, entity} = mockClient()

  client.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>
  )

  client.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>
  )

  await client.catchOutgoingSet().then(child => {
    t.deepEqual(child, <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />)
  })

  await delay()

  t.is(entity.jid.toString(), jid)
})

test('with string resource', async t => {
  const resource = Math.random().toString()
  const jid = 'foo@bar/' + resource

  const {client, entity} = mockClient({resource})

  client.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>
  )

  client.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>
  )

  await client.catchOutgoingSet().then(child => {
    t.deepEqual(
      child,
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
        <resource>{resource}</resource>
      </bind>
    )
  })

  await delay()

  t.is(entity.jid.toString(), jid)
})

test('with function resource', async t => {
  const resource = Math.random().toString()
  const jid = 'foo@bar/' + resource

  const {client, entity} = mockClient({
    resource: async bind => {
      await delay()
      t.is((await bind(resource)).toString(), jid)
    },
  })

  client.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>
  )

  client.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>
  )

  await client.catchOutgoingSet().then(child => {
    t.deepEqual(
      child,
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
        <resource>{resource}</resource>
      </bind>
    )
  })

  await delay()

  t.is(entity.jid.toString(), jid)
})
