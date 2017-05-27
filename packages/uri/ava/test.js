'use strict'

const test = require('ava')
const parse = require('..').parse
const JID = require('@xmpp/jid').JID

test('parse', t => {
  t.deepEqual(parse('xmpp://guest@example.com/support@example.com/truc?message;subject=Hello%20World'), {
    authority: new JID('guest@example.com'),
    path: new JID('support@example.com/truc'),
    query: {
      type: 'message',
      params: {
        subject: 'Hello World',
      },
    },
  })

  t.deepEqual(new JID('foobar'), new JID('foobar'))

  t.deepEqual(parse('xmpp:support@example.com/truc?message;subject=Hello%20World;body=foobar'), {
    path: new JID('support@example.com/truc'),
    query: {
      type: 'message',
      params: {
        subject: 'Hello World',
        body: 'foobar',
      },
    },
  })

  t.deepEqual(parse('xmpp:support@example.com/truc'), {
    path: new JID('support@example.com/truc'),
  })

  t.deepEqual(parse('xmpp:support@example.com/'), {
    path: new JID('support@example.com/'),
  })

  t.deepEqual(parse('xmpp:support@example.com/?foo'), {
    path: new JID('support@example.com/'),
    query: {
      type: 'foo',
      params: {},
    },
  })

  t.deepEqual(parse('xmpp:support@example.com?foo'), {
    path: new JID('support@example.com'),
    query: {
      type: 'foo',
      params: {},
    },
  })
})
