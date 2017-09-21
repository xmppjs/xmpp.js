'use strict'

const test = require('ava')
const plugin = require('../caller')
const testPlugin = require('../../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('get', t => {
  t.context.scheduleIncomingResult(
    <query xmlns="jabber:iq:version">
      <os>foo</os>
      <version>bar</version>
      <name>foobar</name>
    </query>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <query xmlns="jabber:iq:version" />)
    }),
    t.context.plugin.get().then(version => {
      t.deepEqual(version, {
        os: 'foo',
        version: 'bar',
        name: 'foobar',
      })
    }),
  ])
})
