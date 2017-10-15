'use strict'

const test = require('ava')
const IncomingContext = require('../lib/IncomingContext')
const OutgoingContext = require('../lib/OutgoingContext')
const {client} = require('../../test')
const middleware = require('..')

test.beforeEach(t => {
  t.context = client()
  t.context.middleware = middleware(t.context.entity)
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
  t.context.middleware.filter((ctx, next) => {
    t.true(ctx instanceof OutgoingContext)
    t.deepEqual(ctx.stanza, stanza)
    t.is(ctx.entity, t.context.entity)
    t.true(next() instanceof Promise)
    t.end()
  })
  t.context.fakeOutgoing(stanza)
})
