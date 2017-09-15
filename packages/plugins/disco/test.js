'use strict'

const test = require('ava')
const discoCallee = require('./callee')
const testPlugin = require('../testPlugin')

test('disco.build', t => {
  t.deepEqual(
    discoCallee.build(['foo', 'bar'], [{category: 'a', type: 'b', name: 'c'}]),
    <query xmlns="http://jabber.org/protocol/disco#info">
      <feature var="foo" />
      <feature var="bar" />
      <identity category="a" type="b" name="c" />
    </query>
  )
})

test('adds disco#info feature', t => {
  const {plugin} = testPlugin(discoCallee)
  t.true(plugin.features.has('http://jabber.org/protocol/disco#info'))
})
