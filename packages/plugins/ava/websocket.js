'use strict'

const test = require('ava')
const ConnectionWebSocket = require('../websocket/lib/Connection')

test('socketParameters()', t => {
  let params

  params = ConnectionWebSocket.prototype.socketParameters('ws://foo')
  t.is(params, 'ws://foo')

  params = ConnectionWebSocket.prototype.socketParameters('wss://foo')
  t.is(params, 'wss://foo')

  params = ConnectionWebSocket.prototype.socketParameters('http://foo')
  t.is(params, undefined)
})
