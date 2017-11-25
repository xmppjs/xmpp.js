'use strict'

const test = require('ava')
const plugin = require('.')
const testPlugin = require('@xmpp/test/testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
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
    t.context.plugin.bind().then(jid => {
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
    t.context.plugin.bind('resource').then(jid => {
      t.is(jid, 'foo@bar/foobar')
    }),
  ])
})
