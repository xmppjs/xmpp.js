'use strict'

const test = require('ava')
const {context} = require('@xmpp/test')
const _middleware = require('@xmpp/middleware')
const _iqCaller = require('@xmpp/iq/caller')
const _versionCaller = require('./caller')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware({entity})
  const iqCaller = _iqCaller({middleware, entity})
  ctx.versionCaller = _versionCaller({iqCaller})
  t.context = ctx
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
    t.context.versionCaller.get().then(version => {
      t.deepEqual(version, {
        os: 'foo',
        version: 'bar',
        name: 'foobar',
      })
    }),
  ])
})
