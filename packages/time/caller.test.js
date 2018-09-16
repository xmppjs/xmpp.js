'use strict'

const test = require('ava')
const {context} = require('@xmpp/test')
const _middleware = require('@xmpp/middleware')
const _iqCaller = require('@xmpp/iq/caller')
const _versionCaller = require('./caller')

test.beforeEach(t => {
  const ctx = context()
  const {entity} = ctx
  const middleware = _middleware(entity)
  const iqCaller = _iqCaller({middleware, entity})
  ctx.versionCaller = _versionCaller({iqCaller})
  t.context = ctx
})

test('get', t => {
  t.context.scheduleIncomingResult(
    <time xmlns="urn:xmpp:time">
      <tzo>-06:00</tzo>
      <utc>2006-12-19T17:58:35Z</utc>
    </time>
  )

  return Promise.all([
    t.context.catchOutgoingGet().then(child => {
      t.deepEqual(child, <time xmlns="urn:xmpp:time" />)
    }),
    t.context.versionCaller.get().then(time => {
      t.deepEqual(time, {
        tzo: '-06:00',
        utc: '2006-12-19T17:58:35Z',
      })
    }),
  ])
})
