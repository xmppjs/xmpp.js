'use strict'

const test = require('ava')
const plugin = require('../callee')
const testPlugin = require('../../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('disco feature', t => {
  t.true(
    t.context.plugins['disco-callee'].features.has(
      'http://jabber.org/protocol/disco#info'
    )
  )
})

test('disco.build', t => {
  t.deepEqual(
    plugin.build(['foo', 'bar'], [{category: 'a', type: 'b', name: 'c'}]),
    <query xmlns="http://jabber.org/protocol/disco#info">
      <feature var="foo" />
      <feature var="bar" />
      <identity category="a" type="b" name="c" />
    </query>
  )
})

test('info', t => {
  t.context.plugin.features.add('foo')
  t.context.plugin.features.add('bar')
  t.context.plugin.identities.add({
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
