'use strict'

const test = require('ava')
const IncomingContext = require('../lib/IncomingContext')
const OutgoingContext = require('../lib/OutgoingContext')
const {context, mockClient, mockInput, promiseError} = require('@xmpp/test')
const middleware = require('..')

test.beforeEach(t => {
  t.context = context()
  const {entity} = t.context
  t.context.middleware = middleware({entity})
})

test.cb('use', t => {
  t.plan(4)
  const stanza = <presence />
  t.context.middleware.use((ctx, next) => {
    t.true(ctx instanceof IncomingContext)
    t.deepEqual(ctx.stanza, stanza)
    t.is(ctx.entity, t.context.entity)
    t.true(next() instanceof Promise)
    t.end()
  })
  t.context.fakeIncoming(stanza)
})

test.cb('filter', t => {
  t.plan(4)
  const stanza = <presence />
  /* eslint-disable array-callback-return */
  t.context.middleware.filter((ctx, next) => {
    t.true(ctx instanceof OutgoingContext)
    t.deepEqual(ctx.stanza, stanza)
    t.is(ctx.entity, t.context.entity)
    t.true(next() instanceof Promise)
    t.end()
  })
  /* eslint-enable array-callback-return */
  t.context.fakeOutgoing(stanza)
})

test('emits an error event if a middleware throws', async t => {
  const xmpp = mockClient()
  const {middleware} = xmpp

  const error = new Error('foobar')
  const willError = promiseError(xmpp)

  middleware.use(async () => {
    await Promise.resolve()
    throw error
  })

  mockInput(xmpp, <presence id="hello" />)

  const err = await willError
  t.deepEqual(err, error)
})
