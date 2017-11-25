'use strict'

const test = require('ava')
const plugin = require('../callee')
const testPlugin = require('@xmpp/test/testPlugin')
const time = require('@xmpp/time')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
})

test('disco feature', t => {
  t.true(t.context.plugins['disco-callee'].features.has('urn:xmpp:time'))
})

test('getTime', t => {
  const ti = {
    tzo: time.offset(),
    utc: time.datetime(),
  }
  t.deepEqual(t.context.plugin.getTime(), ti)
})

test('respond', t => {
  t.context.plugin.getTime = () => {
    return {
      tzo: 'foo',
      utc: 'bar',
    }
  }

  return t.context
    .fakeIncomingGet(<time xmlns="urn:xmpp:time" />)
    .then(child => {
      t.deepEqual(
        child,
        <time xmlns="urn:xmpp:time">
          <tzo>foo</tzo>
          <utc>bar</utc>
        </time>
      )
    })
})
