'use strict'

/* eslint node/no-extraneous-require: 0 */

const test = require('ava')
const bind = require('.')
const _streamFeatures = require('@xmpp/stream-features')
const _middleware = require('@xmpp/middleware')
const _router = require('@xmpp/router')
const {context} = require('@xmpp/test')
const iqCaller = require('@xmpp/plugins/iq-caller')

test.beforeEach(t => {
  const ctx = context()
  ctx.entity.plugin(iqCaller)
  const middleware = _middleware(ctx.entity)
  const router = _router(middleware)
  const streamFeatures = _streamFeatures(router)
  t.context = ctx
  t.context.bind = bind(streamFeatures)
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
    t.context.bind.bind().then(jid => {
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
    t.context.bind.bind('resource').then(jid => {
      t.is(jid, 'foo@bar/foobar')
    }),
  ])
})
