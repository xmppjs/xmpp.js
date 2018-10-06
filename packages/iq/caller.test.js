'use strict'

const test = require('ava')
const {context, mockClient, mockInput} = require('@xmpp/test')
const _middleware = require('@xmpp/middleware')
const _iqCaller = require('./caller')
const StanzaError = require('@xmpp/middleware/lib/StanzaError')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware({entity})
  ctx.iqCaller = _iqCaller({middleware, entity})
  t.context = ctx
})

test.cb('#get', t => {
  const {iqCaller, entity} = t.context

  entity.send = el => {
    t.is(typeof el.attrs.id, 'string')
    delete el.attrs.id
    t.deepEqual(
      el,
      <iq type="get">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  iqCaller.get(<foo />)
})

test.cb('#set', t => {
  const {iqCaller, entity} = t.context

  entity.send = el => {
    t.is(typeof el.attrs.id, 'string')
    delete el.attrs.id
    t.deepEqual(
      el,
      <iq type="set">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  iqCaller.set(<foo />)
})

test.cb('#request', t => {
  const {iqCaller, entity} = t.context

  entity.send = el => {
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

test.cb('#request with param as string', t => {
  const {iqCaller, entity} = t.context

  entity.send = el => {
    t.deepEqual(
      el,
      <iq type="get" id="foobar" to="service">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  iqCaller.request(
    <iq type="get" id="foobar">
      <foo />
    </iq>,
    'service'
  )
})

test.cb('#request with id and to parameters', t => {
  const {iqCaller, entity} = t.context

  entity.send = el => {
    t.deepEqual(
      el,
      <iq type="get" id="foobar" to="service">
        <foo />
      </iq>
    )
    t.end()
    return Promise.resolve()
  }

  iqCaller.request(
    <iq type="get">
      <foo />
    </iq>,
    {to: 'service', id: 'foobar'}
  )
})

test('removes the handler if sending failed', t => {
  const {iqCaller, entity} = t.context

  const error = new Error('foobar')

  entity.send = () => {
    return Promise.reject(error)
  }

  const promise = iqCaller.request(
    <iq type="get">
      <foo />
    </iq>
  )

  t.is(iqCaller.handlers.size, 1)

  return promise.catch(err => {
    t.is(err, error)
    t.is(iqCaller.handlers.size, 0)
  })
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
