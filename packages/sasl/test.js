'use strict'

const test = require('ava')
const {mockClient, promise} = require('@xmpp/test')

const username = 'foo'
const password = 'bar'
const credentials = {username, password}

test('no compatibles mechanisms', async t => {
  const {client, entity} = mockClient({username, password})

  client.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>FOO</mechanism>
      </mechanisms>
    </features>
  )

  const error = await promise(entity, 'error')
  t.true(error instanceof Error)
  t.is(error.message, 'No compatible mechanism')
})

test('with object credentials', async t => {
  const {client, entity} = mockClient({credentials})
  entity.restart = () => {
    entity.emit('open')
    return Promise.resolve()
  }

  client.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>PLAIN</mechanism>
      </mechanisms>
    </features>
  )

  t.deepEqual(
    await promise(entity, 'send'),
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">
      AGZvbwBiYXI=
    </auth>
  )

  client.mockInput(<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl" />)

  await promise(entity, 'online')
})

test('with function credentials', async t => {
  const mech = 'PLAIN'

  function authenticate(auth, mechanism) {
    t.is(mechanism, mech)
    return auth(credentials)
  }

  const {client, entity} = mockClient({credentials: authenticate})
  entity.restart = () => {
    entity.emit('open')
    return Promise.resolve()
  }

  client.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>{mech}</mechanism>
      </mechanisms>
    </features>
  )

  t.deepEqual(
    await promise(entity, 'send'),
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism={mech}>
      AGZvbwBiYXI=
    </auth>
  )

  client.mockInput(<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl" />)

  await promise(entity, 'online')
})

test('failure', async t => {
  const {client, entity} = mockClient({credentials})

  client.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>PLAIN</mechanism>
      </mechanisms>
    </features>
  )

  t.deepEqual(
    await promise(entity, 'send'),
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">
      AGZvbwBiYXI=
    </auth>
  )

  const failure = (
    <failure xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <some-condition />
    </failure>
  )

  client.mockInput(failure)

  const error = await promise(entity, 'error')
  t.true(error instanceof Error)
  t.is(error.name, 'SASLError')
  t.is(error.condition, 'some-condition')
  t.is(error.element, failure)
})
