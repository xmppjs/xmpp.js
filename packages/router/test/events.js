'use strict'

const test = require('ava')
const _events = require('../events')
const IncomingContext = require('@xmpp/middleware/lib/IncomingContext')
const JID = require('@xmpp/jid')

function events(stanza) {
  const entity = {jid: new JID('foo@bar/foobar')}
  const ctx = new IncomingContext(entity, stanza)
  return _events(ctx)
}

test('events', t => {
  t.deepEqual(
    events(
      <message type="normal">
        <foobar xmlns="foo:bar" />
      </message>
    ),
    [
      'message',
      'message-normal',
      'message/foo:bar/foobar',
      'message-normal/foo:bar/foobar',
    ]
  )

  t.deepEqual(
    events(
      <message type="normal">
        <foobar />
      </message>
    ),
    ['message', 'message-normal', 'message//foobar', 'message-normal//foobar']
  )

  t.deepEqual(
    events(
      <message type="nor/mal">
        <foobar xmlns="foo/bar" />
      </message>
    ),
    [
      'message',
      'message-nor/mal',
      'message/foo/bar/foobar',
      'message-nor/mal/foo/bar/foobar',
    ]
  )

  t.deepEqual(events(<foo />), ['foo'])
})
