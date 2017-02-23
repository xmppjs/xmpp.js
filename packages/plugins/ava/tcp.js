'use strict'

const test = require('ava')
const TCP = require('../tcp').TCP

test('match()', t => {
  t.deepEqual(TCP.match('xmpp://foobar'), {host: 'foobar', port: 5222})
  t.deepEqual(TCP.match('xmpp://foobar:5224'), {host: 'foobar', port: 5224})

  t.is(TCP.match('foobar:2222'), false)
  t.is(TCP.match('xmpp:foobar:2222'), false)
  t.is(TCP.match('ws://foobar:2222'), false)
  t.is(TCP.match('wss://foobar:2222'), false)
  t.is(TCP.match('http://foobar:2222'), false)
  t.is(TCP.match('https://foobar:2222'), false)
})
