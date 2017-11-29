'use strict'

/* eslint node/no-extraneous-require: 0 */

const test = require('ava')
const bind = require('.')
const {context} = require('@xmpp/test')
const iqCaller = require('@xmpp/plugins/iq-caller')

test.beforeEach(t => {
  const ctx = context()
  ctx.entity.plugin(iqCaller)
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
    bind.bind(t.context.entity).then(jid => {
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
    bind.bind(t.context.entity, 'resource').then(jid => {
      t.is(jid, 'foo@bar/foobar')
    }),
  ])
})
