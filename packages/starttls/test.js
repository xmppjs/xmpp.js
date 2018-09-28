'use strict'

const test = require('ava')
const {mockClient, promise} = require('@xmpp/test')

test('failure', async t => {
  const {client, entity} = mockClient()

  client.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
    </features>
  )

  t.deepEqual(
    await promise(entity, 'send'),
    <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
  )

  client.mockInput(<failure xmlns="urn:ietf:params:xml:ns:xmpp-tls" />)

  const err = await promise(entity, 'error')
  t.true(err instanceof Error)
  t.is(err.message, 'STARTTLS_FAILURE')
})
