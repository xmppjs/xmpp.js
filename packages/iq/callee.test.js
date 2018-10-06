'use strict'

const test = require('ava')
const {mockClient, promiseSend, mockInput, promiseError} = require('@xmpp/test')
const _iqCallee = require('./callee')

test('empty result when the handler returns true', async t => {
  const xmpp = mockClient()
  const callee = _iqCallee(xmpp)

  callee.get('bar', 'foo', () => true)

  mockInput(
    xmpp,
    <iq type="get" id="123">
      <foo xmlns="bar" />
    </iq>
  )

  t.deepEqual(await promiseSend(xmpp), <iq id="123" type="result" />)
})

test('non empty result when the handler returns an xml.Element', async t => {
  const xmpp = mockClient()
  const callee = _iqCallee(xmpp)

  callee.get('bar', 'foo', () => {
    return <hello />
  })

  mockInput(
    xmpp,
    <iq type="get" id="123">
      <foo xmlns="bar" />
    </iq>
  )

  t.deepEqual(
    await promiseSend(xmpp),
    <iq id="123" type="result">
      <hello />
    </iq>
  )
})

test('service unavailable error reply when there are no handler', async t => {
  const xmpp = mockClient()
  _iqCallee(xmpp)

  xmpp.mockInput(
    <iq type="get" id="123">
      <foo xmlns="bar" />
    </iq>
  )

  t.deepEqual(
    await promiseSend(xmpp),
    <iq id="123" type="error">
      <foo xmlns="bar" />
      <error type="cancel">
        <service-unavailable xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
      </error>
    </iq>
  )
})

test('internal server error reply when handler throws an error', async t => {
  const xmpp = mockClient()
  const callee = _iqCallee(xmpp)

  const error = new Error('foobar')
  const errorPromise = promiseError(xmpp)
  const outputPromise = promiseSend(xmpp)

  callee.get('bar', 'foo', () => {
    throw error
  })

  mockInput(
    xmpp,
    <iq type="get" id="123">
      <foo xmlns="bar" />
    </iq>
  )

  t.is(await errorPromise, error)
  t.deepEqual(
    await outputPromise,
    <iq id="123" type="error">
      <foo xmlns="bar" />
      <error type="cancel">
        <internal-server-error xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
      </error>
    </iq>
  )
})

test('internal server error reply when handler rejects with an error', async t => {
  const xmpp = mockClient()
  const callee = _iqCallee(xmpp)

  const error = new Error('foobar')
  const errorPromise = promiseError(xmpp)
  const outputPromise = promiseSend(xmpp)

  callee.set('bar', 'foo', () => {
    return Promise.reject(error)
  })

  mockInput(
    xmpp,
    <iq type="set" id="123">
      <foo xmlns="bar" />
    </iq>
  )

  t.is(await errorPromise, error)
  t.deepEqual(
    await outputPromise,
    <iq id="123" type="error">
      <foo xmlns="bar" />
      <error type="cancel">
        <internal-server-error xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
      </error>
    </iq>
  )
})

test('stanza error reply when handler returns an error element', async t => {
  const xmpp = mockClient()
  const callee = _iqCallee(xmpp)

  const outputPromise = promiseSend(xmpp)

  const errorElement = (
    <error type="foo">
      <bar xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
    </error>
  )

  callee.set('bar', 'foo', () => {
    return errorElement
  })

  mockInput(
    xmpp,
    <iq type="set" id="123">
      <foo xmlns="bar" />
    </iq>
  )

  t.deepEqual(
    await outputPromise,
    <iq id="123" type="error">
      <foo xmlns="bar" />
      {errorElement}
    </iq>
  )
})
