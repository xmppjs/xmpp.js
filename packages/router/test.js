'use strict'

const test = require('ava')
const {client} = require('../test')
const router = require('.')
const middleware = require('../middleware')

test.beforeEach(t => {
  t.context = client()
  t.context.middleware = middleware(t.context.entity)
  t.context.router = router(t.context.middleware)
})

test.cb('use', t => {
  const stanza = <presence />
  t.context.router.use('presence', () => {
    t.end()
  })
  t.context.fakeIncoming(stanza)
})

test.cb('filter', t => {
  const stanza = (
    <message type="normal">
      <foobar xmlns="foo:bar" />
    </message>
  )
  t.context.router.filter('message-normal/foo:bar/foobar', () => {
    t.end()
  })
  t.context.fakeOutgoing(stanza)
})
