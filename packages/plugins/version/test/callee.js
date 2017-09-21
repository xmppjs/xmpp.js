'use strict'

const test = require('ava')
const plugin = require('../callee')
const testPlugin = require('../../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('disco feature', t => {
  t.true(t.context.plugins['disco-callee'].features.has('jabber:iq:version'))
})

test('respond', t => {
  t.context.plugin.name = 'foo'
  t.context.plugin.version = 'bar'
  t.context.plugin.os = 'foobar'

  return t.context
    .fakeIncomingGet(<query xmlns="jabber:iq:version" />)
    .then(child => {
      t.deepEqual(
        child,
        <query xmlns="jabber:iq:version">
          <name>foo</name>
          <version>bar</version>
          <os>foobar</os>
        </query>
      )
    })
})
