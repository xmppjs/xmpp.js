'use strict'

const test = require('ava')
const Client = require('../lib/Client')

test('match()', t => {
  t.deepEqual(Client.match('xmpp://foobar'), {host: 'foobar', port: 5222})
  t.deepEqual(Client.match('xmpp://foobar:5224'), {host: 'foobar', port: 5224})

  t.is(Client.match('foobar:2222'), false)
  t.is(Client.match('xmpp:foobar:2222'), false)
  t.is(Client.match('ws://foobar:2222'), false)
  t.is(Client.match('wss://foobar:2222'), false)
  t.is(Client.match('http://foobar:2222'), false)
  t.is(Client.match('https://foobar:2222'), false)
})
