'use strict'

const test = require('ava')
const {context} = require('@xmpp/test')
const _discoCallee = require('./callee')
const _middleware = require('@xmpp/middleware')
const _iqCallee = require('@xmpp/iq-callee')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware(entity)
  const iqCallee = _iqCallee({middleware, entity})
  ctx.discoCallee = _discoCallee({iqCallee})
  t.context = ctx
})

test('disco feature', t => {
  t.true(
    t.context.discoCallee.features.has('http://jabber.org/protocol/disco#info')
  )
})

test('disco.build', t => {
  t.deepEqual(
    _discoCallee.build(['foo', 'bar'], [{category: 'a', type: 'b', name: 'c'}]),
    <query xmlns="http://jabber.org/protocol/disco#info">
      <feature var="foo" />
      <feature var="bar" />
      <identity category="a" type="b" name="c" />
    </query>
  )
})

test('info', t => {
  t.context.discoCallee.features.add('foo')
  t.context.discoCallee.features.add('bar')
  t.context.discoCallee.identities.add({
    category: 'foo',
    type: 'bar',
    name: 'foobar',
  })

  return t.context
    .fakeIncomingGet(<query xmlns="http://jabber.org/protocol/disco#info" />)
    .then(child => {
      t.deepEqual(
        child,
        <query xmlns="http://jabber.org/protocol/disco#info">
          <feature var="http://jabber.org/protocol/disco#info" />
          <feature var="foo" />
          <feature var="bar" />
          <identity category="foo" type="bar" name="foobar" />
        </query>
      )
    })
})
