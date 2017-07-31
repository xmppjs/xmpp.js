'use strict'

const test = require('ava')
const ConnectionWebSocket = require('./lib/Connection')

test('connectParameters()', t => {
  let params

  params = ConnectionWebSocket.prototype.connectParameters({uri: 'ws://foo'})
  t.deepEqual(params, 'ws://foo')

  params = ConnectionWebSocket.prototype.connectParameters({uri: 'wss://foo'})
  t.deepEqual(params, 'wss://foo')

  params = ConnectionWebSocket.prototype.connectParameters({uri: 'http://foo'})
  t.is(params, undefined)
})
