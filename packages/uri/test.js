'use strict'

const test = require('ava')
const {parse} = require('.')
const jid = require('@xmpp/jid')

test('parse', t => {
  t.deepEqual(
    parse(
      'xmpp://guest@example.com/support@example.com/truc?message;subject=Hello%20World'
    ),
    {
      authority: jid('guest@example.com'),
      path: jid('support@example.com/truc'),
      query: {
        type: 'message',
        params: {
          subject: 'Hello World',
        },
      },
    }
  )

  t.deepEqual(jid('foobar'), jid('foobar'))

  t.deepEqual(
    parse(
      'xmpp:support@example.com/truc?message;subject=Hello%20World;body=foobar'
    ),
    {
      path: jid('support@example.com/truc'),
      query: {
        type: 'message',
        params: {
          subject: 'Hello World',
          body: 'foobar',
        },
      },
    }
  )

  t.deepEqual(parse('xmpp:support@example.com/truc'), {
    path: jid('support@example.com/truc'),
  })

  t.deepEqual(parse('xmpp:support@example.com/'), {
    path: jid('support@example.com/'),
  })

  t.deepEqual(parse('xmpp:support@example.com/?foo'), {
    path: jid('support@example.com/'),
    query: {
      type: 'foo',
      params: {},
    },
  })

  t.deepEqual(parse('xmpp:support@example.com?foo'), {
    path: jid('support@example.com'),
    query: {
      type: 'foo',
      params: {},
    },
  })
})
