'use strict'

const test = require('ava')
const {mockClient, mockInput} = require('@xmpp/test')
const StanzaError = require('@xmpp/middleware/lib/StanzaError')

test.cb('#request', t => {
  const xmpp = mockClient()
  const {iqCaller} = xmpp

  xmpp.send = el => {
    t.deepEqual(
      el,
      <iq type="get" id="foobar">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  iqCaller.request(
    <iq type="get" id="foobar">
      <foo />
    </iq>
  )
})

test('removes the handler if sending failed', async t => {
  const xmpp = mockClient()
  const {iqCaller} = xmpp

  const error = new Error('foobar')

  xmpp.send = () => {
    return Promise.reject(error)
  }

  const promise = iqCaller.request(
    <iq type="get">
      <foo />
    </iq>
  )

  t.is(iqCaller.handlers.size, 1)

  try {
    await promise
  } catch (err) {
    t.is(err, error)
    t.is(iqCaller.handlers.size, 0)
  }
})

test('rejects with a StanzaError for error reply', async t => {
  const xmpp = mockClient()
  const {iqCaller} = xmpp

  const id = 'foo'

  const promiseRequest = iqCaller.request(<iq type="get" id={id} />)

  const errorElement = (
    <error type="modify">
      <service-unavailable />
    </error>
  )
  const stanzaElement = (
    <iq type="error" id={id}>
      {errorElement}
    </iq>
  )
  mockInput(xmpp, stanzaElement)

  const err = await t.throwsAsync(promiseRequest)
  t.deepEqual(err, StanzaError.fromElement(errorElement))
})

test('rejects with a TimeoutError if no answer is received within timeout', async t => {
  const xmpp = mockClient()
  const {iqCaller} = xmpp

  const promise = iqCaller.request(
    <iq type="get">
      <foo />
    </iq>,
    1
  )

  t.is(iqCaller.handlers.size, 1)

  try {
    await promise
  } catch (err) {
    t.is(err.name, 'TimeoutError')
    t.is(iqCaller.handlers.size, 0)
  }
})
