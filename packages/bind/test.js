'use strict'

/* eslint node/no-extraneous-require: 0 */

const test = require('ava')
const bind = require('.')
const {context} = require('@xmpp/test')
const _middleware = require('@xmpp/middleware')
const _iqCaller = require('@xmpp/iq-caller')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx

  const middleware = (ctx.middleware = _middleware(entity))
  ctx.iqCaller = _iqCaller({entity, middleware})

  t.context = ctx
})

test('without resource', t => {
  t.context.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>foo@bar/foobar</jid>
    </bind>
  )

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(child, <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />)
    }),
    bind.bind(t.context.entity, t.context.iqCaller).then(jid => {
      t.is(jid, 'foo@bar/foobar')
    }),
  ])
})

test('with resource', t => {
  t.context.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>foo@bar/foobar</jid>
    </bind>
  )

  return Promise.all([
    t.context.catchOutgoingSet().then(child => {
      t.deepEqual(
        child,
        <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
          <resource>resource</resource>
        </bind>
      )
    }),
    bind.bind(t.context.entity, t.context.iqCaller, 'resource').then(jid => {
      t.is(jid, 'foo@bar/foobar')
    }),
  ])
})
