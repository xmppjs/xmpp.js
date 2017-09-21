'use strict'

const test = require('ava')
const plugin = require('../caller')
const testPlugin = require('../../testPlugin')

test.beforeEach(t => {
  t.context = testPlugin(plugin)
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
    t.context.plugin.get().then(time => {
      t.deepEqual(time, {
        tzo: '-06:00',
        utc: '2006-12-19T17:58:35Z',
      })
    }),
  ])
})
